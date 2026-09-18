-- Hire vs Build projects, and more than one selected candidate.
--
-- projects.purpose:  'hire'  — the company is recruiting; it may select up to
--                              `openings` candidates (1–10) and the project keeps
--                              taking applications until they are filled.
--                    'build' — the company just wants the work done; exactly one
--                              candidate, and applications close at selection.
--
-- Work now runs per selected candidate: project_selections.status tracks each
-- candidate's cycle (in_progress → submitted → under_review →
-- revision_requested → completed). Feedback and outcomes are one per candidate.
-- The project's own status follows: open while openings remain, in_progress
-- once they are filled, completed when every selected candidate is finished.
--
-- Also closes a gap: company members could INSERT project_selections directly,
-- bypassing the one-time decision and openings rules. Selections are now only
-- created by apply_application_decision.
--
-- Safe to re-run.

BEGIN;

-- 1. Purpose and openings ----------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'hire';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS openings INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_purpose_check;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_purpose_check CHECK (purpose IN ('hire', 'build'));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_openings_check;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_openings_check
    CHECK (openings BETWEEN 1 AND 10 AND (purpose = 'hire' OR openings = 1));

-- 2. Selections: one per candidate, each with its own work status ---------------
ALTER TABLE public.project_selections
    DROP CONSTRAINT IF EXISTS project_selections_project_id_key;
DO $$ BEGIN
    ALTER TABLE public.project_selections
        ADD CONSTRAINT project_selections_project_candidate_key UNIQUE (project_id, candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- Carry each existing selection's state over from its project.
UPDATE public.project_selections s
SET status = CASE p.status
        WHEN 'submitted' THEN 'submitted'
        WHEN 'under_review' THEN 'under_review'
        WHEN 'revision_requested' THEN 'revision_requested'
        WHEN 'completed' THEN 'completed'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'in_progress'
    END
FROM public.projects p
WHERE p.id = s.project_id
  AND s.status NOT IN ('in_progress', 'submitted', 'under_review',
                       'revision_requested', 'completed', 'cancelled');

ALTER TABLE public.project_selections ALTER COLUMN status SET DEFAULT 'in_progress';
ALTER TABLE public.project_selections DROP CONSTRAINT IF EXISTS project_selections_status_check;
ALTER TABLE public.project_selections
    ADD CONSTRAINT project_selections_status_check
    CHECK (status IN ('in_progress', 'submitted', 'under_review',
                      'revision_requested', 'completed', 'cancelled'));

-- Project status now summarises its selections: work under way is in_progress.
UPDATE public.projects
SET status = 'in_progress'
WHERE status IN ('candidate_selected', 'submitted', 'under_review', 'revision_requested');

DROP POLICY IF EXISTS "Company members can select candidates" ON public.project_selections;

-- 3. Feedback and outcome: one per candidate, not per project -------------------
ALTER TABLE public.project_feedback DROP CONSTRAINT IF EXISTS project_feedback_project_id_key;
DO $$ BEGIN
    ALTER TABLE public.project_feedback
        ADD CONSTRAINT project_feedback_project_candidate_key UNIQUE (project_id, candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.project_outcomes DROP CONSTRAINT IF EXISTS project_outcomes_project_id_key;
DO $$ BEGIN
    ALTER TABLE public.project_outcomes
        ADD CONSTRAINT project_outcomes_project_candidate_key UNIQUE (project_id, candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- 4. Keep the project's status in step with its selections ----------------------
CREATE OR REPLACE FUNCTION public.refresh_project_progress(target_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
    selected INTEGER;
    active INTEGER;
    next_status public.project_status;
BEGIN
    SELECT * INTO project_row FROM public.projects WHERE id = target_project_id FOR UPDATE;
    IF NOT FOUND OR project_row.status IN ('completed', 'cancelled', 'draft') THEN
        RETURN;
    END IF;

    SELECT count(*),
           count(*) FILTER (WHERE status NOT IN ('completed', 'cancelled'))
    INTO selected, active
    FROM public.project_selections
    WHERE project_id = target_project_id;

    next_status := project_row.status;
    IF selected >= project_row.openings THEN
        next_status := CASE WHEN active = 0 THEN 'completed' ELSE 'in_progress' END;
    ELSIF selected > 0 AND active = 0 AND now() > project_row.application_deadline THEN
        -- Recruiting is over and everyone selected has finished.
        next_status := 'completed';
    END IF;

    IF next_status IS DISTINCT FROM project_row.status THEN
        UPDATE public.projects SET status = next_status WHERE id = target_project_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_project_progress(UUID) FROM PUBLIC, anon, authenticated;

-- 5. Selecting: final, within the openings, created here only --------------------
CREATE OR REPLACE FUNCTION public.apply_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
    selected INTEGER;
BEGIN
    IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('selected', 'rejected', 'withdrawn')
        AND (NEW.status IS DISTINCT FROM OLD.status
             OR NEW.decision_note IS DISTINCT FROM OLD.decision_note) THEN
        RAISE EXCEPTION 'This application has a final decision (%) and can''t be changed.',
            OLD.status USING ERRCODE = 'P0001';
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'selected' THEN
        SELECT * INTO project_row FROM public.projects WHERE id = NEW.project_id FOR UPDATE;

        IF project_row.status NOT IN ('published', 'applications_open') THEN
            RAISE EXCEPTION 'This project can''t select more candidates in its current state.'
                USING ERRCODE = 'P0001';
        END IF;

        SELECT count(*) INTO selected
        FROM public.project_selections WHERE project_id = NEW.project_id;

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

DROP TRIGGER IF EXISTS apply_application_decision ON public.applications;
CREATE TRIGGER apply_application_decision
    BEFORE UPDATE OF status, decision_note ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.apply_application_decision();

-- 6. Submitting: per candidate ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_project_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    work_status TEXT;
BEGIN
    SELECT status INTO work_status
    FROM public.project_selections
    WHERE project_id = NEW.project_id AND candidate_id = NEW.candidate_id
    FOR UPDATE;

    IF work_status IS NULL OR work_status NOT IN ('in_progress', 'revision_requested') THEN
        RAISE EXCEPTION 'This project is not accepting a submission from you right now.'
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.project_selections SET status = 'submitted'
    WHERE project_id = NEW.project_id AND candidate_id = NEW.candidate_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_project_submission ON public.project_submissions;
CREATE TRIGGER apply_project_submission
    BEFORE INSERT ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_project_submission();

-- 7. Deciding on a submission: per candidate ----------------------------------------
CREATE OR REPLACE FUNCTION public.apply_submission_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('accepted', 'revision_requested', 'rejected')
        AND (NEW.status IS DISTINCT FROM OLD.status
             OR NEW.review_note IS DISTINCT FROM OLD.review_note) THEN
        RAISE EXCEPTION 'This submission already has a final decision (%).',
            replace(OLD.status::text, '_', ' ') USING ERRCODE = 'P0001';
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('accepted', 'revision_requested', 'rejected') THEN
        NEW.reviewed_at := now();
    END IF;

    UPDATE public.project_selections
    SET status = CASE NEW.status
        WHEN 'accepted' THEN 'completed'
        WHEN 'rejected' THEN 'completed'
        WHEN 'revision_requested' THEN 'revision_requested'
        ELSE 'under_review'
    END
    WHERE project_id = NEW.project_id AND candidate_id = NEW.candidate_id;

    PERFORM public.refresh_project_progress(NEW.project_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_submission_decision ON public.project_submissions;
CREATE TRIGGER apply_submission_decision
    BEFORE UPDATE OF status, review_note ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_submission_decision();

-- 8. Hide / withdraw only while nobody is working on it --------------------------------
CREATE OR REPLACE FUNCTION public.guard_project_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status
        OR pg_trigger_depth() > 1
        OR coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('draft', 'cancelled')
        AND EXISTS (SELECT 1 FROM public.project_selections WHERE project_id = NEW.id) THEN
        RAISE EXCEPTION 'Candidates are already working on this project, so it can''t be hidden or withdrawn.'
            USING ERRCODE = 'P0001';
    END IF;

    IF (OLD.status IN ('published', 'applications_open') AND NEW.status = 'draft')
        OR (OLD.status = 'draft' AND NEW.status = 'applications_open')
        OR (OLD.status IN ('draft', 'published', 'applications_open')
            AND NEW.status = 'cancelled') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'This project can''t be changed from % to % here.',
        replace(OLD.status::text, '_', ' '), replace(NEW.status::text, '_', ' ')
        USING ERRCODE = 'P0001';
END;
$$;

-- 9. Account deletion: blocked by work in flight, per selection ------------------------
CREATE OR REPLACE FUNCTION public.account_deletion_blockers()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT coalesce(array_agg(reason), '{}')
    FROM (
        SELECT 'You''re working on "' || p.title || '". Submit it and wait for the '
               || 'startup''s decision first.' AS reason
        FROM public.project_selections s
        JOIN public.candidate_profiles cp ON cp.id = s.candidate_id
        JOIN public.projects p ON p.id = s.project_id
        WHERE cp.user_id = auth.uid()
          AND s.status NOT IN ('completed', 'cancelled')

        UNION ALL

        SELECT DISTINCT 'Candidates are working on "' || p.title || '". Decide on their '
               || 'work first.'
        FROM public.company_members m
        JOIN public.projects p ON p.company_id = m.company_id
        JOIN public.project_selections s ON s.project_id = p.id
        WHERE m.user_id = auth.uid()
          AND NOT EXISTS (
              SELECT 1 FROM public.company_members other
              WHERE other.company_id = m.company_id AND other.user_id <> auth.uid()
          )
          AND s.status NOT IN ('completed', 'cancelled')

        UNION ALL

        SELECT 'Admin accounts are removed by hand.' WHERE public.is_admin()
    ) reasons;
$$;

-- 10. Track record counts candidates, not projects -----------------------------------
CREATE OR REPLACE FUNCTION public.company_track_record(target_company_id UUID)
RETURNS TABLE (
    open_projects INTEGER,
    completed_evaluations INTEGER,
    hires INTEGER,
    interviews INTEGER,
    cancelled_projects INTEGER
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
          WHERE p.company_id = target_company_id AND s.status = 'completed'),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'hire'),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'interview'),
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id AND p.status = 'cancelled');
$$;

-- 11. Company alerts link to that candidate's evaluation page ------------------------
CREATE OR REPLACE FUNCTION public.notify_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
    note TEXT := nullif(btrim(coalesce(NEW.review_note, '')), '');
BEGIN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;

    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'work_submitted', 'Work submitted',
            public.candidate_display_name(NEW.candidate_id) || ' submitted work for ' || project_title,
            '/company/projects/' || NEW.project_id || '/review/' || NEW.candidate_id);
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status = 'submitted' THEN
        RETURN NEW;
    END IF;

    PERFORM public.notify_user(
        public.candidate_user_id(NEW.candidate_id), NEW.project_id,
        'submission_status',
        CASE NEW.status
            WHEN 'under_review' THEN 'Submission under review'
            WHEN 'revision_requested' THEN 'Revision requested on ' || project_title
            WHEN 'accepted' THEN 'Work accepted on ' || project_title
            ELSE 'Work not accepted on ' || project_title
        END,
        coalesce(note, project_title),
        '/candidate/trials/' || NEW.project_id);

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_project_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_name TEXT;
BEGIN
    SELECT c.name INTO company_name
    FROM public.projects p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = NEW.project_id;

    IF NEW.author_role = 'candidate' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'message',
            'Question from ' || public.candidate_display_name(NEW.candidate_id),
            NEW.body,
            '/company/projects/' || NEW.project_id || '/review/' || NEW.candidate_id);
    ELSE
        PERFORM public.notify_user(
            public.candidate_user_id(NEW.candidate_id), NEW.project_id, 'message',
            'Message from ' || coalesce(company_name, 'the company'),
            NEW.body,
            '/candidate/trials/' || NEW.project_id);
    END IF;

    RETURN NEW;
END;
$$;

COMMIT;
