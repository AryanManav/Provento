-- Profiles as identities: the social graph, public activity, and privacy.
--
-- 1. profile_social: follower and following counts for a profile, and whether
--    the viewer follows it. "Following" is what a candidate follows; companies
--    only have followers.
-- 2. profile_connections: the followers (or following) list itself, as public
--    identities — a candidate follower appears as their candidate profile, a
--    startup's user as their company. Candidates who hide their profile from
--    search are left out of every list (they still count).
-- 3. candidate_public_profile: adds `activity_dates` (days with recorded
--    progress in the last 14 weeks — dates only, never what was done) so the
--    streak is visible on the profile; and returns {id, private: true} instead
--    of nothing for a hidden profile, so the page can say it's private.
-- 4. company_track_record: adds projects_posted (projects that were ever
--    public — drafts never shown aren't counted).
--
-- Safe to re-run.

BEGIN;

-- Shared visibility rule: a candidate profile anyone may see.
CREATE OR REPLACE FUNCTION public.candidate_is_visible(target_candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.candidate_profiles cp
        WHERE cp.id = target_candidate_id
          AND (cp.is_discoverable OR cp.user_id = auth.uid() OR public.is_admin())
    );
$$;

REVOKE ALL ON FUNCTION public.candidate_is_visible(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.candidate_is_visible(UUID) TO authenticated;

-- 1. Counts -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_social(
    target_company_id UUID DEFAULT NULL,
    target_candidate_id UUID DEFAULT NULL
)
RETURNS TABLE (followers INTEGER, following INTEGER, viewer_follows BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        (SELECT count(*)::int FROM public.follows f
          WHERE (target_company_id IS NOT NULL AND f.company_id = target_company_id)
             OR (target_candidate_id IS NOT NULL AND f.candidate_id = target_candidate_id)),
        (SELECT count(*)::int FROM public.follows f
           JOIN public.candidate_profiles cp ON cp.user_id = f.follower_id
          WHERE target_candidate_id IS NOT NULL AND cp.id = target_candidate_id),
        EXISTS (SELECT 1 FROM public.follows f
                 WHERE f.follower_id = auth.uid()
                   AND ((target_company_id IS NOT NULL AND f.company_id = target_company_id)
                     OR (target_candidate_id IS NOT NULL AND f.candidate_id = target_candidate_id)))
    WHERE target_candidate_id IS NULL OR public.candidate_is_visible(target_candidate_id);
$$;

REVOKE ALL ON FUNCTION public.profile_social(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_social(UUID, UUID) TO authenticated;

-- 2. Lists ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_connections(
    direction TEXT,
    target_company_id UUID DEFAULT NULL,
    target_candidate_id UUID DEFAULT NULL
)
RETURNS TABLE (
    kind TEXT,
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    viewer_follows BOOLEAN,
    is_viewer BOOLEAN,
    followed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH edges AS (
        -- followers: the users who follow the target
        SELECT f.follower_id AS user_id, NULL::uuid AS company_id,
               NULL::uuid AS candidate_id, f.created_at
        FROM public.follows f
        WHERE direction = 'followers'
          AND ((target_company_id IS NOT NULL AND f.company_id = target_company_id)
            OR (target_candidate_id IS NOT NULL AND f.candidate_id = target_candidate_id))
        UNION ALL
        -- following: what the target candidate's user follows
        SELECT NULL, f.company_id, f.candidate_id, f.created_at
        FROM public.follows f
        JOIN public.candidate_profiles cp ON cp.user_id = f.follower_id
        WHERE direction = 'following' AND cp.id = target_candidate_id
    ),
    resolved AS (
        -- A following edge to a company, or a follower who works at one.
        SELECT 'company' AS kind, c.id, c.name AS title, c.industry AS subtitle,
               c.logo_url AS image_url, e.created_at
        FROM edges e
        JOIN public.companies c
          ON c.id = coalesce(e.company_id,
                             (SELECT m.company_id FROM public.company_members m
                               WHERE m.user_id = e.user_id LIMIT 1))
        WHERE e.company_id IS NOT NULL
           OR (e.user_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM public.candidate_profiles x
                               WHERE x.user_id = e.user_id))
        UNION ALL
        -- A following edge to a candidate, or a follower who is one.
        SELECT 'candidate', cp.id, u.full_name, cp.headline, u.avatar_url, e.created_at
        FROM edges e
        JOIN public.candidate_profiles cp
          ON cp.id = e.candidate_id OR cp.user_id = e.user_id
        JOIN public.users u ON u.id = cp.user_id
        WHERE cp.is_discoverable OR cp.user_id = auth.uid()
    )
    SELECT r.kind, r.id, r.title, r.subtitle, r.image_url,
           EXISTS (SELECT 1 FROM public.follows v
                    WHERE v.follower_id = auth.uid()
                      AND ((r.kind = 'company' AND v.company_id = r.id)
                        OR (r.kind = 'candidate' AND v.candidate_id = r.id))),
           (r.kind = 'candidate' AND EXISTS (
                SELECT 1 FROM public.candidate_profiles me
                WHERE me.id = r.id AND me.user_id = auth.uid())),
           r.created_at
    FROM resolved r
    WHERE direction IN ('followers', 'following')
      AND (target_candidate_id IS NULL OR public.candidate_is_visible(target_candidate_id))
    ORDER BY r.created_at DESC
    LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.profile_connections(TEXT, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_connections(TEXT, UUID, UUID) TO authenticated;

-- 3. Public candidate profile: activity, and an explicit private state ---------------------
CREATE OR REPLACE FUNCTION public.candidate_public_profile(target_candidate_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN NOT (cp.is_discoverable OR cp.user_id = auth.uid() OR public.is_admin())
            THEN jsonb_build_object('id', cp.id, 'private', true)
        ELSE jsonb_build_object(
            'id', cp.id,
            'private', false,
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
                WHERE s.candidate_id = cp.id AND s.status = 'completed'),
            'verified_work', coalesce((
                SELECT jsonb_agg(work ORDER BY work->>'accepted_at' DESC)
                FROM (
                    SELECT jsonb_build_object(
                        'project_id', p.id,
                        'title', p.title,
                        'company_id', c.id,
                        'company_name', c.name,
                        'category', p.category,
                        'expected_hours', p.expected_hours,
                        'stack', coalesce((
                            SELECT jsonb_agg(ps.skill_name ORDER BY ps.is_required DESC, ps.skill_name)
                            FROM public.project_skills ps WHERE ps.project_id = p.id), '[]'::jsonb),
                        'accepted_at', coalesce((
                            SELECT max(sub.reviewed_at) FROM public.project_submissions sub
                            WHERE sub.project_id = p.id AND sub.candidate_id = cp.id
                              AND sub.status = 'accepted'), sel.selected_at)
                    ) AS work
                    FROM public.project_selections sel
                    JOIN public.projects p ON p.id = sel.project_id
                    JOIN public.companies c ON c.id = p.company_id
                    WHERE sel.candidate_id = cp.id AND sel.status = 'completed'
                ) accepted), '[]'::jsonb),
            -- One entry per recorded activity (a day can repeat); dates only.
            'activity_dates', coalesce((
                SELECT jsonb_agg(a.activity_date ORDER BY a.activity_date)
                FROM public.candidate_activity a
                WHERE a.candidate_id = cp.id
                  AND a.activity_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date - 100), '[]'::jsonb)
        )
    END
    FROM public.candidate_profiles cp
    JOIN public.users u ON u.id = cp.user_id
    WHERE cp.id = target_candidate_id;
$$;

REVOKE ALL ON FUNCTION public.candidate_public_profile(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.candidate_public_profile(UUID) TO authenticated;

-- 4. Track record with projects posted ------------------------------------------------------
DROP FUNCTION IF EXISTS public.company_track_record(UUID);

CREATE FUNCTION public.company_track_record(target_company_id UUID)
RETURNS TABLE (
    open_projects INTEGER,
    completed_evaluations INTEGER,
    hires INTEGER,
    interviews INTEGER,
    cancelled_projects INTEGER,
    projects_posted INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id
            AND p.status IN ('published', 'applications_open')),
        (SELECT count(*)::int FROM public.project_selections s
           JOIN public.projects p ON p.id = s.project_id
          WHERE p.company_id = target_company_id
            AND s.status IN ('completed', 'not_accepted')),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'hire'),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'interview'),
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id AND p.status = 'cancelled'),
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id
            AND p.status NOT IN ('draft', 'pending_review'));
$$;

REVOKE ALL ON FUNCTION public.company_track_record(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_track_record(UUID) TO authenticated;

COMMIT;
