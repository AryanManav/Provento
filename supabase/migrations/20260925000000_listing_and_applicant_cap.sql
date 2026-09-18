-- Browse listing until the deadline, and an optional applicant cap.
--
-- 1. projects.max_applicants: the company may cap how many candidates can
--    apply (NULL = no cap). Withdrawn applications free their place.
-- 2. The public read policy covers a project's whole live life. It stopped at
--    in_progress, so once work was submitted the project vanished for everyone
--    but its applicants — including from Browse, before its deadline.
-- 3. project_application_counts(): how many places are taken, as counts only,
--    so the directory can show "3 spots left" / "Full".
-- 4. enforce_application_window: applications are refused in the database once
--    a project isn't open, its deadline has passed, or it's full. The row lock
--    stops two last-second applications both taking the final place.
--
-- Safe to re-run.

BEGIN;

-- 1. Cap --------------------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS max_applicants INTEGER;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_max_applicants_check;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_max_applicants_check
    CHECK (max_applicants IS NULL OR max_applicants BETWEEN 1 AND 500);

-- 2. Visibility ---------------------------------------------------------------
DROP POLICY IF EXISTS "Published projects viewable by everyone" ON public.projects;
CREATE POLICY "Published projects viewable by everyone"
    ON public.projects FOR SELECT
    USING (
        status IN ('published', 'applications_open', 'candidate_selected',
                   'in_progress', 'submitted', 'under_review',
                   'revision_requested', 'completed')
        OR public.is_company_member(company_id)
        OR public.is_admin()
    );

-- 3. Places taken ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_application_counts(project_ids UUID[])
RETURNS TABLE (project_id UUID, applications INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.project_id, count(*)::int
    FROM public.applications a
    WHERE a.project_id = ANY (project_ids)
      AND a.status <> 'withdrawn'
    GROUP BY a.project_id;
$$;

REVOKE ALL ON FUNCTION public.project_application_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_application_counts(UUID[]) TO anon, authenticated;

-- 4. Enforcement ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_application_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
    taken INTEGER;
BEGIN
    SELECT * INTO project_row FROM public.projects WHERE id = NEW.project_id FOR UPDATE;

    IF NOT FOUND OR project_row.status NOT IN ('published', 'applications_open') THEN
        RAISE EXCEPTION 'This project is no longer accepting applications'
            USING ERRCODE = 'P0001';
    END IF;

    IF now() > project_row.application_deadline THEN
        RAISE EXCEPTION 'The application deadline for this project has passed'
            USING ERRCODE = 'P0001';
    END IF;

    IF project_row.max_applicants IS NOT NULL THEN
        SELECT count(*) INTO taken
        FROM public.applications
        WHERE project_id = NEW.project_id AND status <> 'withdrawn';

        IF taken >= project_row.max_applicants THEN
            RAISE EXCEPTION 'This project is full — it has reached its applicant limit'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_application_window ON public.applications;
CREATE TRIGGER enforce_application_window
    BEFORE INSERT ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.enforce_application_window();

COMMIT;
