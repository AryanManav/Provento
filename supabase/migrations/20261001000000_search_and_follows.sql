-- Search, public candidate profiles, follows, and new-project alerts.
--
-- Candidate profiles stay private at the table level (self + applicant
-- companies). Search and the public profile go through SECURITY DEFINER
-- functions that return an explicit, public-safe set of fields — never email,
-- resume, or application history — and only for candidates who keep
-- candidate_profiles.is_discoverable on (default on; a switch in Settings).
--
-- follows: anyone signed in can follow a company or a candidate. Rows are
-- private to the follower; counts come from follow_stats().
--
-- notify_followers_of_new_project: when a company posts a project that's open
-- for applications, everyone following that company is notified.
--
-- Safe to re-run.

BEGIN;

-- 1. Discoverability ---------------------------------------------------------------
ALTER TABLE public.candidate_profiles
    ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT true;

-- 2. Follows ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT follows_one_target CHECK ((company_id IS NULL) <> (candidate_id IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS follows_company_unique
    ON public.follows(follower_id, company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS follows_candidate_unique
    ON public.follows(follower_id, candidate_id) WHERE candidate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_follows_company ON public.follows(company_id);
CREATE INDEX IF NOT EXISTS idx_follows_candidate ON public.follows(candidate_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own follows" ON public.follows;
CREATE POLICY "Users see their own follows"
    ON public.follows FOR SELECT TO authenticated
    USING (follower_id = auth.uid());

-- Following yourself (your own candidate profile) is refused.
DROP POLICY IF EXISTS "Users follow as themselves" ON public.follows;
CREATE POLICY "Users follow as themselves"
    ON public.follows FOR INSERT TO authenticated
    WITH CHECK (
        follower_id = auth.uid()
        AND (candidate_id IS NULL OR candidate_id IS DISTINCT FROM public.get_current_candidate_id())
    );

DROP POLICY IF EXISTS "Users unfollow their own follows" ON public.follows;
CREATE POLICY "Users unfollow their own follows"
    ON public.follows FOR DELETE TO authenticated
    USING (follower_id = auth.uid());

REVOKE UPDATE ON public.follows FROM anon, authenticated;

-- 3. Search ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_directory(query TEXT)
RETURNS TABLE (
    kind TEXT,
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    location TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH term AS (
        -- Escape LIKE wildcards so a search for "50%" means the text.
        SELECT '%' || replace(replace(replace(btrim(query), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS pattern
        WHERE char_length(btrim(query)) >= 2
    )
    (
        SELECT 'company', c.id, c.name, c.industry, c.logo_url, c.location
        FROM public.companies c, term
        WHERE c.name ILIKE term.pattern
           OR c.industry ILIKE term.pattern
           OR array_to_string(c.tech_stack, ' ') ILIKE term.pattern
        ORDER BY c.name
        LIMIT 20
    )
    UNION ALL
    (
        SELECT DISTINCT ON (u.full_name, cp.id)
               'candidate', cp.id, u.full_name, cp.headline, u.avatar_url, cp.location
        FROM public.candidate_profiles cp
        JOIN public.users u ON u.id = cp.user_id
        CROSS JOIN term
        LEFT JOIN public.candidate_skills s ON s.candidate_id = cp.id
        WHERE (cp.is_discoverable OR cp.user_id = auth.uid())
          AND (u.full_name ILIKE term.pattern
               OR cp.headline ILIKE term.pattern
               OR s.skill_name ILIKE term.pattern)
        ORDER BY u.full_name, cp.id
        LIMIT 20
    );
$$;

-- 4. Public candidate profile ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.candidate_public_profile(target_candidate_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', cp.id,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url,
        'banner_url', cp.banner_url,
        'headline', cp.headline,
        'bio', cp.bio,
        'location', cp.location,
        'education', cp.education,
        'graduation_year', cp.graduation_year,
        'github_url', cp.github_url,
        'portfolio_url', cp.portfolio_url,
        'linkedin_url', cp.linkedin_url,
        'is_self', cp.user_id = auth.uid(),
        'skills', coalesce((
            SELECT jsonb_agg(jsonb_build_object('name', s.skill_name, 'level', s.skill_level)
                             ORDER BY s.skill_name)
            FROM public.candidate_skills s WHERE s.candidate_id = cp.id), '[]'::jsonb),
        'projects', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                       'title', p.title, 'description', p.description,
                       'technologies', p.technologies,
                       'repository_url', p.repository_url, 'live_url', p.live_url)
                   ORDER BY p.created_at DESC)
            FROM public.candidate_projects p WHERE p.candidate_id = cp.id), '[]'::jsonb),
        'verified_projects', (
            SELECT count(*) FROM public.project_selections s
            WHERE s.candidate_id = cp.id AND s.status = 'completed')
    )
    FROM public.candidate_profiles cp
    JOIN public.users u ON u.id = cp.user_id
    WHERE cp.id = target_candidate_id
      AND (cp.is_discoverable OR cp.user_id = auth.uid() OR public.is_admin());
$$;

-- 5. Follower counts ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.follow_stats(
    target_company_id UUID DEFAULT NULL,
    target_candidate_id UUID DEFAULT NULL
)
RETURNS TABLE (followers INTEGER, following BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        count(*)::int,
        coalesce(bool_or(f.follower_id = auth.uid()), false)
    FROM public.follows f
    WHERE (target_company_id IS NOT NULL AND f.company_id = target_company_id)
       OR (target_candidate_id IS NOT NULL AND f.candidate_id = target_candidate_id);
$$;

REVOKE ALL ON FUNCTION public.search_directory(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.candidate_public_profile(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.follow_stats(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_directory(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.candidate_public_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.follow_stats(UUID, UUID) TO authenticated;

-- 6. Tell followers about a new project ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_followers_of_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_name TEXT;
BEGIN
    IF NEW.status NOT IN ('published', 'applications_open') THEN
        RETURN NEW;
    END IF;

    SELECT name INTO company_name FROM public.companies WHERE id = NEW.company_id;

    INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url)
    SELECT f.follower_id, NEW.id, 'new_project',
           coalesce(company_name, 'A company you follow') || ' posted a new project',
           left(NEW.title, 280),
           '/projects/' || NEW.slug
    FROM public.follows f
    WHERE f.company_id = NEW.company_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_followers_of_new_project ON public.projects;
CREATE TRIGGER notify_followers_of_new_project
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.notify_followers_of_new_project();

COMMIT;
