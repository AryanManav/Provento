-- A message with every company decision.
--
-- applications.decision_note: written when a company selects or rejects.
-- project_submissions.review_note / reviewed_at: written with the decision on
-- a submission (required by the app for a revision request — the candidate
-- needs to know what to change).
--
-- Notes are part of the decision, so they are final with it: the decision
-- triggers now refuse a note edit once the decision is recorded. The
-- notification the candidate receives carries the note.
--
-- Safe to re-run.

BEGIN;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS decision_note TEXT;
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_decision_note_length;
ALTER TABLE public.applications
    ADD CONSTRAINT applications_decision_note_length
    CHECK (decision_note IS NULL OR char_length(decision_note) <= 1000);

ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.project_submissions DROP CONSTRAINT IF EXISTS project_submissions_review_note_length;
ALTER TABLE public.project_submissions
    ADD CONSTRAINT project_submissions_review_note_length
    CHECK (review_note IS NULL OR char_length(review_note) <= 2000);

-- Applications: final decisions, now including their note --------------------
CREATE OR REPLACE FUNCTION public.apply_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        IF EXISTS (SELECT 1 FROM public.project_selections WHERE project_id = NEW.project_id) THEN
            RAISE EXCEPTION 'A candidate has already been selected for this project.'
                USING ERRCODE = 'P0001';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = NEW.project_id AND status IN ('published', 'applications_open')
        ) THEN
            RAISE EXCEPTION 'This project can''t select a candidate in its current state.'
                USING ERRCODE = 'P0001';
        END IF;

        INSERT INTO public.project_selections (project_id, candidate_id, selected_by, status)
        VALUES (NEW.project_id, NEW.candidate_id, auth.uid(), 'active');

        UPDATE public.projects SET status = 'candidate_selected' WHERE id = NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_application_decision ON public.applications;
CREATE TRIGGER apply_application_decision
    BEFORE UPDATE OF status, decision_note ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.apply_application_decision();

-- Submissions: one decision, with its note and time --------------------------
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

    UPDATE public.projects
    SET status = CASE NEW.status
        WHEN 'accepted' THEN 'completed'::project_status
        WHEN 'rejected' THEN 'completed'::project_status
        WHEN 'revision_requested' THEN 'revision_requested'::project_status
        ELSE 'under_review'::project_status
    END
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_submission_decision ON public.project_submissions;
CREATE TRIGGER apply_submission_decision
    BEFORE UPDATE OF status, review_note ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_submission_decision();

-- Notifications carry the company's message ------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
    candidate_name TEXT;
    note TEXT := nullif(btrim(coalesce(NEW.decision_note, '')), '');
BEGIN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
    candidate_name := public.candidate_display_name(NEW.candidate_id);

    IF TG_OP = 'INSERT' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'application_received', 'New applicant',
            candidate_name || ' applied to ' || project_title,
            '/company/projects/' || NEW.project_id || '/applicants/' || NEW.id);
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'withdrawn' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'application_withdrawn', 'Application withdrawn',
            candidate_name || ' withdrew from ' || project_title,
            '/company/projects/' || NEW.project_id);
    ELSIF NEW.status = 'selected' THEN
        PERFORM public.notify_user(
            public.candidate_user_id(NEW.candidate_id), NEW.project_id,
            'application_status', 'You were selected for ' || project_title,
            coalesce(note, 'The brief and your workspace are ready — start building.'),
            '/candidate/trials/' || NEW.project_id);
    ELSIF NEW.status IN ('reviewing', 'shortlisted', 'rejected') THEN
        PERFORM public.notify_user(
            public.candidate_user_id(NEW.candidate_id), NEW.project_id,
            'application_status',
            CASE NEW.status
                WHEN 'reviewing' THEN 'Application under review'
                WHEN 'shortlisted' THEN 'You were shortlisted'
                ELSE 'Application not selected'
            END,
            coalesce(note, project_title),
            '/candidate/applications');
    END IF;

    RETURN NEW;
END;
$$;

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
            '/company/projects/' || NEW.project_id || '/review');
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

COMMIT;
