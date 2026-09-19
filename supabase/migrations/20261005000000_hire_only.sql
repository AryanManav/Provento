-- Two kinds of opportunity: BUILD ONLY (the existing paid project) and HIRE
-- ONLY (a free job posting — no project, no payment, no trial).
--
-- 1. projects.opportunity_type: 'build' | 'hire'. Every existing row is a paid
--    project, so it becomes 'build' and behaves exactly as before.
-- 2. Hire-only fields: job type, work arrangement, location, experience level,
--    compensation, responsibilities, nice-to-haves. Hire-only postings must
--    set an application limit of at least their number of openings.
-- 3. normalize_opportunity (before insert): a new build project always has one
--    candidate; a hire posting never carries a fee, deliverables or criteria.
--    The type can't change after creation.
-- 4. applications.status gains 'interview'. Hire pipeline:
--      submitted/reviewing → shortlisted → interview → selected | rejected
--    Selecting a hire candidate is a hire, not a trial: no project_selections
--    row. It stops at the number of openings, and filling the last opening
--    closes the posting (status completed = hiring complete).
--    Build projects keep reviewing → selected | rejected.
-- 5. Applications: a hire posting closes at its application limit (every
--    non-withdrawn application counts) or when its openings are filled.
-- 6. Notifications speak each type's language (shortlisted, invited to
--    interview, selected for a role; selected for a project).
--
-- Safe to re-run. The ALTER TYPE runs first, outside the transaction, and the
-- new value is only referenced as text below so it works in one run.

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview';

BEGIN;

-- 1–2. Type and hire-only fields -------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS opportunity_type TEXT NOT NULL DEFAULT 'build';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS work_arrangement TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS job_location TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS compensation TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS responsibilities TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS nice_to_have TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_opportunity_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_opportunity_type_check
    CHECK (opportunity_type IN ('build', 'hire'));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_job_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_job_type_check
    CHECK (job_type IS NULL OR job_type IN ('full_time', 'part_time', 'internship', 'contract'));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_work_arrangement_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_work_arrangement_check
    CHECK (work_arrangement IS NULL OR work_arrangement IN ('remote', 'hybrid', 'onsite'));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_experience_level_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_experience_level_check
    CHECK (experience_level IS NULL OR experience_level IN ('entry', 'junior', 'mid', 'senior'));

-- Openings: a hire posting may hire up to 100; build projects keep their rule.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_openings_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_openings_check
    CHECK (
        (opportunity_type = 'hire' AND openings BETWEEN 1 AND 100)
        OR (opportunity_type = 'build' AND openings BETWEEN 1 AND 10
            AND (purpose = 'hire' OR openings = 1))
    );

-- A hire posting has an application limit, and it's at least its openings.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_hire_capacity_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_hire_capacity_check
    CHECK (
        opportunity_type = 'build'
        OR (max_applicants IS NOT NULL AND max_applicants >= openings)
    );

CREATE INDEX IF NOT EXISTS idx_projects_opportunity_type ON public.projects(opportunity_type);

-- 3. Normalise on insert, freeze the type afterwards ----------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_opportunity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.opportunity_type IS DISTINCT FROM OLD.opportunity_type THEN
            RAISE EXCEPTION 'An opportunity''s type can''t be changed after it is posted.'
                USING ERRCODE = 'P0001';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.opportunity_type = 'build' THEN
        -- Build only: one selected candidate completes the project.
        NEW.purpose := 'build';
        NEW.openings := 1;
    ELSE
        -- Hire only: a role, not a project. Nothing to build, nothing paid.
        NEW.purpose := 'hire';
        NEW.payment_amount := 0;
        NEW.deliverables := '{}';
        NEW.acceptance_criteria := '{}';
        NEW.evaluation_criteria := '{}';
        NEW.project_deadline := NEW.application_deadline;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_opportunity ON public.projects;
CREATE TRIGGER normalize_opportunity
    BEFORE INSERT OR UPDATE OF opportunity_type ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.normalize_opportunity();

-- 4. Decisions on applications -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
    selected INTEGER;
    old_status TEXT := OLD.status::text;
    new_status TEXT := NEW.status::text;
BEGIN
    IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF old_status IN ('selected', 'rejected', 'withdrawn')
        AND (new_status IS DISTINCT FROM old_status
             OR NEW.decision_note IS DISTINCT FROM OLD.decision_note) THEN
        RAISE EXCEPTION 'This application has a final decision (%) and can''t be changed.',
            old_status USING ERRCODE = 'P0001';
    END IF;

    IF new_status IS NOT DISTINCT FROM old_status THEN
        RETURN NEW;
    END IF;

    -- Every decision locks the opportunity, so two decisions can't race past a limit.
    SELECT * INTO project_row FROM public.projects WHERE id = NEW.project_id FOR UPDATE;

    IF project_row.opportunity_type = 'hire' THEN
        -- The hiring pipeline only moves forward.
        IF new_status = 'shortlisted' AND old_status NOT IN ('submitted', 'reviewing') THEN
            RAISE EXCEPTION 'Only a new application can be shortlisted.' USING ERRCODE = 'P0001';
        END IF;
        IF new_status = 'interview' AND old_status NOT IN ('submitted', 'reviewing', 'shortlisted') THEN
            RAISE EXCEPTION 'This candidate is already past the interview stage.'
                USING ERRCODE = 'P0001';
        END IF;
        IF new_status = 'reviewing' AND old_status <> 'submitted' THEN
            RAISE EXCEPTION 'This application has already moved on.' USING ERRCODE = 'P0001';
        END IF;

        IF new_status = 'selected' THEN
            IF project_row.status NOT IN ('published', 'applications_open') THEN
                RAISE EXCEPTION 'Hiring for this role is closed.' USING ERRCODE = 'P0001';
            END IF;

            SELECT count(*) INTO selected
            FROM public.applications
            WHERE project_id = NEW.project_id AND status::text = 'selected';

            IF selected >= project_row.openings THEN
                RAISE EXCEPTION 'All % openings for this role are filled.', project_row.openings
                    USING ERRCODE = 'P0001';
            END IF;

            -- A hire, not a trial: no project to build. Filling the last opening
            -- completes hiring and closes the posting.
            IF selected + 1 >= project_row.openings THEN
                UPDATE public.projects SET status = 'completed' WHERE id = NEW.project_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    -- Build only: the paid-project flow, unchanged.
    IF new_status IN ('shortlisted', 'interview') THEN
        RAISE EXCEPTION 'Build projects go straight from review to a decision.'
            USING ERRCODE = 'P0001';
    END IF;

    IF new_status = 'selected' THEN
        IF project_row.status NOT IN ('published', 'applications_open') THEN
            RAISE EXCEPTION 'This project can''t select more candidates in its current state.'
                USING ERRCODE = 'P0001';
        END IF;

        SELECT count(*) INTO selected
        FROM public.project_selections
        WHERE project_id = NEW.project_id AND status <> 'not_accepted';

        IF selected >= project_row.openings THEN
            RAISE EXCEPTION '%', CASE project_row.purpose
                WHEN 'build' THEN 'A build project has one candidate, and one is already selected.'
                ELSE 'All ' || project_row.openings || ' openings on this project are filled.'
            END USING ERRCODE = 'P0001';
        END IF;

        INSERT INTO public.project_selections (project_id, candidate_id, selected_by, status)
        VALUES (NEW.project_id, NEW.candidate_id, auth.uid(), 'in_progress');

        PERFORM public.refresh_project_progress(NEW.project_id);
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Taking applications ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_application_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
    taken INTEGER;
    hired INTEGER;
BEGIN
    SELECT * INTO project_row FROM public.projects WHERE id = NEW.project_id FOR UPDATE;

    IF NOT FOUND OR project_row.status NOT IN ('published', 'applications_open') THEN
        RAISE EXCEPTION '%', CASE
            WHEN FOUND AND project_row.opportunity_type = 'hire' AND project_row.status = 'completed'
                THEN 'Every opening for this role has been filled.'
            ELSE 'This opportunity is no longer accepting applications'
        END USING ERRCODE = 'P0001';
    END IF;

    IF now() > project_row.application_deadline THEN
        RAISE EXCEPTION 'The application deadline has passed' USING ERRCODE = 'P0001';
    END IF;

    IF project_row.opportunity_type = 'hire' THEN
        SELECT count(*) FILTER (WHERE status::text <> 'withdrawn'),
               count(*) FILTER (WHERE status::text = 'selected')
        INTO taken, hired
        FROM public.applications
        WHERE project_id = NEW.project_id;

        IF hired >= project_row.openings THEN
            RAISE EXCEPTION 'Every opening for this role has been filled.' USING ERRCODE = 'P0001';
        END IF;
        IF taken >= project_row.max_applicants THEN
            RAISE EXCEPTION 'This role has reached its application limit.' USING ERRCODE = 'P0001';
        END IF;
    ELSIF project_row.max_applicants IS NOT NULL THEN
        SELECT count(*) INTO taken
        FROM public.applications
        WHERE project_id = NEW.project_id AND status::text NOT IN ('withdrawn', 'rejected');

        IF taken >= project_row.max_applicants THEN
            RAISE EXCEPTION 'This project is full — it has reached its applicant limit'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Places taken, as each type counts them.
CREATE OR REPLACE FUNCTION public.project_application_counts(project_ids UUID[])
RETURNS TABLE (project_id UUID, applications INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.project_id, count(*)::int
    FROM public.applications a
    JOIN public.projects p ON p.id = a.project_id
    WHERE a.project_id = ANY (project_ids)
      AND a.status::text <> 'withdrawn'
      AND (p.opportunity_type = 'hire' OR a.status::text <> 'rejected')
    GROUP BY a.project_id;
$$;

REVOKE ALL ON FUNCTION public.project_application_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_application_counts(UUID[]) TO anon, authenticated;

-- 6. Notifications in each type's language --------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
    project_type TEXT;
    candidate_name TEXT;
    note TEXT := nullif(btrim(coalesce(NEW.decision_note, '')), '');
    new_status TEXT := NEW.status::text;
BEGIN
    SELECT title, opportunity_type INTO project_title, project_type
    FROM public.projects WHERE id = NEW.project_id;
    candidate_name := public.candidate_display_name(NEW.candidate_id);

    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'application_received', 'New applicant',
            candidate_name || ' applied to ' || project_title,
            '/company/projects/' || NEW.project_id || '/applicants/' || NEW.id);
        RETURN NEW;
    END IF;

    IF new_status IS NOT DISTINCT FROM OLD.status::text THEN
        RETURN NEW;
    END IF;

    IF new_status = 'withdrawn' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'application_withdrawn', 'Application withdrawn',
            candidate_name || ' withdrew from ' || project_title,
            '/company/projects/' || NEW.project_id);
    ELSIF new_status = 'selected' AND project_type = 'build' THEN
        PERFORM public.notify_user(
            public.candidate_user_id(NEW.candidate_id), NEW.project_id,
            'application_status', 'You were selected for ' || project_title,
            coalesce(note, 'The brief and your workspace are ready — start building.'),
            '/candidate/trials/' || NEW.project_id);
    ELSIF new_status IN ('reviewing', 'shortlisted', 'interview', 'selected', 'rejected') THEN
        PERFORM public.notify_user(
            public.candidate_user_id(NEW.candidate_id), NEW.project_id,
            'application_status',
            CASE new_status
                WHEN 'reviewing' THEN 'Application under review'
                WHEN 'shortlisted' THEN 'You''ve been shortlisted for ' || project_title
                WHEN 'interview' THEN 'You''ve been invited to interview for ' || project_title
                WHEN 'selected' THEN 'You''ve been selected for ' || project_title
                ELSE 'Application not selected'
            END,
            coalesce(note, project_title),
            '/candidate/applications');
    END IF;

    RETURN NEW;
END;
$$;

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
           coalesce(company_name, 'A company you follow')
               || CASE WHEN NEW.opportunity_type = 'hire' THEN ' is hiring' ELSE ' posted a new project' END,
           left(NEW.title, 280),
           '/projects/' || NEW.slug
    FROM public.follows f
    WHERE f.company_id = NEW.company_id;

    RETURN NEW;
END;
$$;

-- Track record: hires include roles filled through Hire Only postings.
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
          WHERE p.company_id = target_company_id AND o.outcome = 'hire')
        + (SELECT count(*)::int FROM public.applications a
             JOIN public.projects p ON p.id = a.project_id
            WHERE p.company_id = target_company_id
              AND p.opportunity_type = 'hire' AND a.status::text = 'selected'),
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
