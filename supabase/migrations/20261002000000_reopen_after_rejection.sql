-- Rejected work, and what happens to the project afterwards.
--
-- 1. project_selections.status gains 'not_accepted': the candidate's cycle
--    ended with the work rejected. Until now rejection also meant 'completed',
--    so rejected work counted as a completed project (and its fee as earned),
--    and it held on to the opening.
-- 2. A not-accepted selection gives its opening back. When rejecting, the
--    company chooses (project_submissions.reopen_project):
--      true  — reopen: the project goes back to accepting applications and
--              Browse lists it again. A deadline that has passed or is about
--              to is moved a week out, with the work deadline shifted by the
--              same amount so the time to build is unchanged.
--      false — close: the opening is dropped (a one-opening project completes).
--    "Another chance" for the same candidate is a revision request, as before.
-- 3. The applicant cap counts places still in play: rejected applications
--    free theirs, so a reopened project that was full can take new applicants.
-- 4. Existing rejected work is re-labelled 'not_accepted'. Those projects are
--    left as they are; only new rejections reopen a project.
--
-- Safe to re-run.

BEGIN;

-- 1. The new work status and the company's choice ---------------------------------
ALTER TABLE public.project_selections DROP CONSTRAINT IF EXISTS project_selections_status_check;
ALTER TABLE public.project_selections
    ADD CONSTRAINT project_selections_status_check
    CHECK (status IN ('in_progress', 'submitted', 'under_review',
                      'revision_requested', 'completed', 'not_accepted', 'cancelled'));

ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS reopen_project BOOLEAN;

-- Backfill: a finished selection whose last decided submission was rejected.
UPDATE public.project_selections s
SET status = 'not_accepted'
WHERE s.status = 'completed'
  AND (
      SELECT sub.status
      FROM public.project_submissions sub
      WHERE sub.project_id = s.project_id
        AND sub.candidate_id = s.candidate_id
        AND sub.status IN ('accepted', 'rejected')
      ORDER BY sub.reviewed_at DESC NULLS LAST, sub.submitted_at DESC
      LIMIT 1
  ) = 'rejected';

-- 2. Project status follows its selections; freed openings reopen it ------------------
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
    shift INTERVAL;
BEGIN
    SELECT * INTO project_row FROM public.projects WHERE id = target_project_id FOR UPDATE;
    IF NOT FOUND OR project_row.status IN ('completed', 'cancelled', 'draft') THEN
        RETURN;
    END IF;

    -- Not-accepted work doesn't hold an opening.
    SELECT count(*) FILTER (WHERE status <> 'not_accepted'),
           count(*) FILTER (WHERE status NOT IN ('completed', 'not_accepted', 'cancelled'))
    INTO selected, active
    FROM public.project_selections
    WHERE project_id = target_project_id;

    next_status := project_row.status;
    IF selected >= project_row.openings THEN
        next_status := CASE WHEN active = 0 THEN 'completed' ELSE 'in_progress' END;
    ELSIF project_row.status = 'in_progress' THEN
        -- An opening was given back: take applications again.
        next_status := 'applications_open';
        IF project_row.application_deadline < now() + interval '3 days' THEN
            shift := (now() + interval '7 days') - project_row.application_deadline;
            UPDATE public.projects
            SET application_deadline = application_deadline + shift,
                project_deadline = project_deadline + shift
            WHERE id = target_project_id;
        END IF;
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

-- 3. Selecting counts only openings still held ------------------------------------------
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

-- 4. Deciding on a submission: rejected work, then reopen or close --------------------
CREATE OR REPLACE FUNCTION public.apply_submission_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_row public.projects%ROWTYPE;
BEGIN
    IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('accepted', 'revision_requested', 'rejected')
        AND (NEW.status IS DISTINCT FROM OLD.status
             OR NEW.review_note IS DISTINCT FROM OLD.review_note
             OR NEW.reopen_project IS DISTINCT FROM OLD.reopen_project) THEN
        RAISE EXCEPTION 'This submission already has a final decision (%).',
            replace(OLD.status::text, '_', ' ') USING ERRCODE = 'P0001';
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status IN ('accepted', 'revision_requested', 'rejected') THEN
        NEW.reviewed_at := now();
    END IF;
    IF NEW.status <> 'rejected' THEN
        NEW.reopen_project := NULL;
    ELSE
        NEW.reopen_project := coalesce(NEW.reopen_project, true);
    END IF;

    UPDATE public.project_selections
    SET status = CASE NEW.status
        WHEN 'accepted' THEN 'completed'
        WHEN 'rejected' THEN 'not_accepted'
        WHEN 'revision_requested' THEN 'revision_requested'
        ELSE 'under_review'
    END
    WHERE project_id = NEW.project_id AND candidate_id = NEW.candidate_id;

    -- Closing drops the opening instead of reopening it.
    IF NEW.status = 'rejected' AND NOT NEW.reopen_project THEN
        SELECT * INTO project_row FROM public.projects WHERE id = NEW.project_id FOR UPDATE;
        IF project_row.openings > 1 THEN
            UPDATE public.projects SET openings = openings - 1 WHERE id = NEW.project_id;
        ELSIF project_row.status NOT IN ('completed', 'cancelled', 'draft') THEN
            UPDATE public.projects SET status = 'completed' WHERE id = NEW.project_id;
        END IF;
    END IF;

    PERFORM public.refresh_project_progress(NEW.project_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_submission_decision ON public.project_submissions;
CREATE TRIGGER apply_submission_decision
    BEFORE UPDATE OF status, review_note, reopen_project ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_submission_decision();

-- 5. A reopened project can be hidden or withdrawn again -------------------------------
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
        AND EXISTS (SELECT 1 FROM public.project_selections
                    WHERE project_id = NEW.id AND status <> 'not_accepted') THEN
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

-- 6. Places taken: rejected applications give theirs back ------------------------------
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
      AND a.status NOT IN ('withdrawn', 'rejected')
    GROUP BY a.project_id;
$$;

REVOKE ALL ON FUNCTION public.project_application_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_application_counts(UUID[]) TO anon, authenticated;

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
        WHERE project_id = NEW.project_id AND status NOT IN ('withdrawn', 'rejected');

        IF taken >= project_row.max_applicants THEN
            RAISE EXCEPTION 'This project is full — it has reached its applicant limit'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 7. Finished work, for deletion blockers and the track record ------------------------
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
          AND s.status NOT IN ('completed', 'not_accepted', 'cancelled')

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
          AND s.status NOT IN ('completed', 'not_accepted', 'cancelled')

        UNION ALL

        SELECT 'Admin accounts are removed by hand.' WHERE public.is_admin()
    ) reasons;
$$;

DROP FUNCTION IF EXISTS public.company_track_record(UUID);

CREATE FUNCTION public.company_track_record(target_company_id UUID)
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
          WHERE p.company_id = target_company_id
            AND s.status IN ('completed', 'not_accepted')),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'hire'),
        (SELECT count(*)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'interview'),
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id AND p.status = 'cancelled');
$$;

REVOKE ALL ON FUNCTION public.company_track_record(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_track_record(UUID) TO authenticated;

COMMIT;
