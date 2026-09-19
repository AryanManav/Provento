-- Search as a core feature, and verified work on public profiles.
--
-- 1. search_directory returns more of what a result needs to be judged at a
--    glance — still only public-safe fields:
--      candidates: skills and how many pieces of work a startup accepted
--      companies:  industry, size, stack, and how many projects are open now
--    With no query (fewer than 2 characters) it lists instead of matching:
--    discoverable candidates by verified work, companies by open projects.
--    That is what "Discover talent" opens on.
-- 2. candidate_public_profile adds `verified_work`: each project a startup
--    accepted — title, company, topic, effort, stack and date. Fees, feedback
--    and hiring outcomes stay private.
--
-- Safe to re-run. The return type changes, so the old function is dropped first.

BEGIN;

-- 1. Search ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_directory(TEXT);

CREATE FUNCTION public.search_directory(query TEXT)
RETURNS TABLE (
    kind TEXT,
    id UUID,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    location TEXT,
    skills TEXT[],
    verified_count INTEGER,
    open_projects INTEGER,
    company_size TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH term AS (
        -- Escape LIKE wildcards so a search for "50%" means the text. An empty
        -- pattern ('%') lists everything, for browsing.
        SELECT CASE
                   WHEN char_length(btrim(coalesce(query, ''))) < 2 THEN '%'
                   ELSE '%' || replace(replace(replace(btrim(query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
               END AS pattern,
               char_length(btrim(coalesce(query, ''))) < 2 AS browsing
    ),
    company_rows AS (
        SELECT c.id, c.name, c.industry, c.logo_url, c.location, c.company_size,
               c.tech_stack,
               (SELECT count(*)::int FROM public.projects p
                 WHERE p.company_id = c.id
                   AND p.status IN ('published', 'applications_open')
                   AND p.application_deadline > now()) AS open_projects
        FROM public.companies c, term
        WHERE term.browsing
           OR c.name ILIKE term.pattern
           OR c.industry ILIKE term.pattern
           OR c.location ILIKE term.pattern
           OR array_to_string(c.tech_stack, ' ') ILIKE term.pattern
    ),
    candidate_rows AS (
        SELECT cp.id, u.full_name, cp.headline, u.avatar_url, cp.location,
               coalesce((SELECT array_agg(s.skill_name ORDER BY s.skill_name)
                         FROM public.candidate_skills s WHERE s.candidate_id = cp.id),
                        '{}') AS skills,
               (SELECT count(*)::int FROM public.project_selections sel
                 WHERE sel.candidate_id = cp.id AND sel.status = 'completed') AS verified
        FROM public.candidate_profiles cp
        JOIN public.users u ON u.id = cp.user_id
        CROSS JOIN term
        WHERE (cp.is_discoverable OR cp.user_id = auth.uid())
          AND (term.browsing
               OR u.full_name ILIKE term.pattern
               OR cp.headline ILIKE term.pattern
               OR cp.location ILIKE term.pattern
               OR EXISTS (SELECT 1 FROM public.candidate_skills s
                          WHERE s.candidate_id = cp.id AND s.skill_name ILIKE term.pattern))
    )
    (
        SELECT 'company', id, name, industry, logo_url, location, tech_stack,
               0, open_projects, company_size
        FROM company_rows
        ORDER BY open_projects DESC, name
        LIMIT 30
    )
    UNION ALL
    (
        SELECT 'candidate', id, full_name, headline, avatar_url, location, skills,
               verified, 0, NULL
        FROM candidate_rows
        ORDER BY verified DESC, full_name
        LIMIT 30
    );
$$;

REVOKE ALL ON FUNCTION public.search_directory(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_directory(TEXT) TO authenticated;

-- 2. Public candidate profile, with verified work -------------------------------------------
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
            ) accepted), '[]'::jsonb)
    )
    FROM public.candidate_profiles cp
    JOIN public.users u ON u.id = cp.user_id
    WHERE cp.id = target_candidate_id
      AND (cp.is_discoverable OR cp.user_id = auth.uid() OR public.is_admin());
$$;

REVOKE ALL ON FUNCTION public.candidate_public_profile(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.candidate_public_profile(UUID) TO authenticated;

COMMIT;
