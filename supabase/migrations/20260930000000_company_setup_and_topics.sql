-- Company setup before posting, richer company profiles, and project topics.
--
-- 1. projects.category: the topic Browse groups projects by.
-- 2. companies: culture and stack (tech_stack, work_style, perks,
--    hiring_process), links (linkedin_url, github_url, careers_url) and
--    founded_year — shown to candidates on the public company page.
-- 3. company_ready_to_post(): a company can't insert a project until its
--    profile has the basics candidates need (name, a real description,
--    industry, size, location). Enforced in the projects INSERT policy, so the
--    app's setup screen isn't the only guard.
-- 4. can_view_user(): teammates can see each other (the Team tab), in addition
--    to self, admins, and companies viewing their applicants.
--
-- Safe to re-run.

BEGIN;

-- 1. Topics ---------------------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_category_check;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_category_check CHECK (category IN (
        'frontend', 'backend', 'full_stack', 'mobile', 'ai_ml',
        'data', 'devops', 'design', 'other'
    ));
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- 2. Richer company profile ------------------------------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tech_stack TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS work_style TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS perks TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS hiring_process TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS careers_url TEXT;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_profile_limits;
ALTER TABLE public.companies
    ADD CONSTRAINT companies_profile_limits CHECK (
        (work_style IS NULL OR work_style IN ('remote', 'hybrid', 'onsite'))
        AND (perks IS NULL OR char_length(perks) <= 1500)
        AND (hiring_process IS NULL OR char_length(hiring_process) <= 1500)
        AND (founded_year IS NULL OR founded_year BETWEEN 1900 AND 2100)
        AND cardinality(tech_stack) <= 30
        AND (linkedin_url IS NULL OR linkedin_url ~* '^https?://')
        AND (github_url IS NULL OR github_url ~* '^https?://')
        AND (careers_url IS NULL OR careers_url ~* '^https?://')
    );

-- 3. Set up before posting -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_ready_to_post(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = target_company_id
          AND char_length(btrim(c.name)) >= 2
          AND char_length(btrim(coalesce(c.description, ''))) >= 80
          AND nullif(btrim(coalesce(c.industry, '')), '') IS NOT NULL
          AND nullif(btrim(coalesce(c.company_size, '')), '') IS NOT NULL
          AND nullif(btrim(coalesce(c.location, '')), '') IS NOT NULL
    );
$$;

REVOKE ALL ON FUNCTION public.company_ready_to_post(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_ready_to_post(UUID) TO authenticated;

DROP POLICY IF EXISTS "Company members can create projects" ON public.projects;
CREATE POLICY "Company members can create projects"
    ON public.projects FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (public.is_company_member(company_id) AND public.company_ready_to_post(company_id))
    );

-- 4. Teammates can see each other ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_view_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT target_user_id = auth.uid()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.candidate_profiles cp
            JOIN public.applications a ON a.candidate_id = cp.id
            JOIN public.projects p ON p.id = a.project_id
            WHERE cp.user_id = target_user_id
              AND public.is_company_member(p.company_id)
        )
        OR EXISTS (
            SELECT 1
            FROM public.company_members mine
            JOIN public.company_members theirs ON theirs.company_id = mine.company_id
            WHERE mine.user_id = auth.uid() AND theirs.user_id = target_user_id
        );
$$;

COMMIT;
