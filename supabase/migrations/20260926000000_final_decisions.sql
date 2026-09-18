-- Decisions are made once.
--
-- Applications: "reviewing" is a working state; "selected" and "rejected" are
-- final. Selecting used to be three separate client calls (update the
-- application, upsert project_selections — silently replacing an earlier pick —
-- then update the project), so a company could flip candidates back and forth.
-- The selection now happens here, atomically, and only once per project.
--
-- Submissions: each submission gets one decision — accepted, revision
-- requested, or rejected — and it can't be changed. Accepting or rejecting ends
-- the work phase (project → completed); a revision request reopens it for a new
-- submission, which gets its own single decision.
--
-- The SQL editor / service role (not end-user sessions) can still correct
-- mistakes by hand.
--
-- Safe to re-run.

BEGIN;

-- Applications ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status
        OR coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('selected', 'rejected', 'withdrawn') THEN
        RAISE EXCEPTION 'This application has a final decision (%) and can''t be changed.',
            OLD.status USING ERRCODE = 'P0001';
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
    BEFORE UPDATE OF status ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.apply_application_decision();

-- Submissions -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_submission_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status
        OR coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('accepted', 'revision_requested', 'rejected') THEN
        RAISE EXCEPTION 'This submission already has a final decision (%).',
            replace(OLD.status::text, '_', ' ') USING ERRCODE = 'P0001';
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
    BEFORE UPDATE OF status ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_submission_decision();

COMMIT;
