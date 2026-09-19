-- Hire-only roles carry a hiring assessment.
--
-- A HIRE ONLY opportunity is not a bare job post: candidates apply, complete
-- an unpaid assessment the company defines, and are hired on the work they
-- submit. BUILD ONLY (one paid candidate) is unchanged.
--
-- 1. projects: assessment_title, assessment_type, assessment_description,
--    assessment_requirements, assessment_technologies. `deliverables`,
--    `evaluation_criteria`, `expected_hours` (estimated time) and
--    `project_deadline` (the assessment deadline) are reused, and are no
--    longer cleared for hire postings.
-- 2. normalize_opportunity: a new hire posting must have an assessment — a
--    title, a brief, requirements and deliverables — and its deadline can't
--    fall before the application deadline. Still never paid. Postings created
--    before this migration keep working without one.
-- 3. assessment_submissions: one per application. Candidates read their own,
--    companies read those for their roles; nobody writes directly —
--    save_assessment() checks the application, the posting and the deadline.
--    Submitted is final.
-- 4. The company hears about each submission (trigger, like every alert).
-- 5. apply_application_decision (hire): a candidate can't be put under review,
--    shortlisted, interviewed or selected before their assessment is in.
--    Filling the last opening completes the posting and marks everyone still
--    in the running "not selected" — they're notified, never left waiting.
-- 6. company_history also returns the assessment title.
--
-- Safe to re-run.

BEGIN;

-- 1. The assessment on the posting ---------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assessment_title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assessment_type TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assessment_description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assessment_requirements TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assessment_technologies TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_assessment_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_assessment_type_check
    CHECK (assessment_type IS NULL OR assessment_type IN (
        'coding', 'frontend', 'backend', 'full_stack', 'design', 'data', 'technical', 'other'
    ));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_assessment_length_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_assessment_length_check
    CHECK (
        (assessment_title IS NULL OR char_length(assessment_title) <= 150)
        AND (assessment_description IS NULL OR char_length(assessment_description) <= 10000)
    );

-- 2. A new hire posting needs its assessment -------------------------------------------------
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
        -- Build only: one selected candidate completes a paid project.
        NEW.purpose := 'build';
        NEW.openings := 1;
        NEW.assessment_title := NULL;
        NEW.assessment_type := NULL;
        NEW.assessment_description := NULL;
        NEW.assessment_requirements := '{}';
        NEW.assessment_technologies := '{}';
        RETURN NEW;
    END IF;

    -- Hire only: several hires, judged on an unpaid assessment.
    IF coalesce(btrim(NEW.assessment_title), '') = ''
        OR coalesce(btrim(NEW.assessment_description), '') = ''
        OR cardinality(NEW.assessment_requirements) = 0
        OR cardinality(NEW.deliverables) = 0 THEN
        RAISE EXCEPTION 'A hiring opportunity needs an assessment: a title, a brief, requirements and deliverables.'
            USING ERRCODE = 'P0001';
    END IF;
    IF NEW.project_deadline < NEW.application_deadline THEN
        RAISE EXCEPTION 'The assessment deadline can''t be before the application deadline.'
            USING ERRCODE = 'P0001';
    END IF;

    NEW.purpose := 'hire';
    NEW.payment_amount := 0;
    NEW.acceptance_criteria := '{}';
    RETURN NEW;
END;
$$;

-- 3. Submissions ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    repository_url TEXT,
    live_url TEXT,
    notes TEXT,
    completed_requirements INTEGER[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_submissions DROP CONSTRAINT IF EXISTS assessment_submissions_status_check;
ALTER TABLE public.assessment_submissions ADD CONSTRAINT assessment_submissions_status_check
    CHECK (status IN ('in_progress', 'submitted'));
ALTER TABLE public.assessment_submissions DROP CONSTRAINT IF EXISTS assessment_submissions_fields_check;
ALTER TABLE public.assessment_submissions ADD CONSTRAINT assessment_submissions_fields_check
    CHECK (
        (repository_url IS NULL OR (repository_url ~* '^https?://' AND char_length(repository_url) <= 500))
        AND (live_url IS NULL OR (live_url ~* '^https?://' AND char_length(live_url) <= 500))
        AND (notes IS NULL OR char_length(notes) <= 5000)
    );

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_project
    ON public.assessment_submissions(project_id);

ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates read their own assessment" ON public.assessment_submissions;
CREATE POLICY "Candidates read their own assessment"
    ON public.assessment_submissions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.candidate_profiles cp
        WHERE cp.id = candidate_id AND cp.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Companies read assessments for their roles" ON public.assessment_submissions;
CREATE POLICY "Companies read assessments for their roles"
    ON public.assessment_submissions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND (public.is_company_member(p.company_id) OR public.is_admin())
    ));

-- Writes only through save_assessment().
REVOKE INSERT, UPDATE, DELETE ON public.assessment_submissions FROM anon, authenticated;
GRANT SELECT ON public.assessment_submissions TO authenticated;

CREATE OR REPLACE FUNCTION public.save_assessment(
    target_project_id UUID,
    repository TEXT,
    live TEXT,
    note TEXT,
    done INTEGER[],
    submit BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    candidate UUID;
    project_row public.projects%ROWTYPE;
    application_row public.applications%ROWTYPE;
    existing TEXT;
    checked INTEGER[];
BEGIN
    SELECT id INTO candidate FROM public.candidate_profiles WHERE user_id = auth.uid();
    IF candidate IS NULL THEN
        RAISE EXCEPTION 'Only candidates can take an assessment.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO project_row FROM public.projects WHERE id = target_project_id;
    IF NOT FOUND OR project_row.opportunity_type <> 'hire'
        OR coalesce(btrim(project_row.assessment_title), '') = '' THEN
        RAISE EXCEPTION 'This opportunity has no hiring assessment.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO application_row
    FROM public.applications
    WHERE project_id = target_project_id AND candidate_id = candidate
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Apply to this role before starting its assessment.' USING ERRCODE = 'P0001';
    END IF;
    IF application_row.status::text IN ('withdrawn', 'rejected', 'selected') THEN
        RAISE EXCEPTION 'Your application has a final decision, so the assessment can''t change.'
            USING ERRCODE = 'P0001';
    END IF;
    IF project_row.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Hiring for this role has closed.' USING ERRCODE = 'P0001';
    END IF;

    SELECT status INTO existing
    FROM public.assessment_submissions
    WHERE application_id = application_row.id
    FOR UPDATE;
    IF existing = 'submitted' THEN
        RAISE EXCEPTION 'You''ve already submitted this assessment.' USING ERRCODE = 'P0001';
    END IF;

    -- Only real requirement positions, once each.
    checked := ARRAY(
        SELECT DISTINCT d FROM unnest(coalesce(done, '{}'::INTEGER[])) AS d
        WHERE d >= 0 AND d < cardinality(project_row.assessment_requirements)
        ORDER BY d
    );

    IF submit THEN
        IF now() > project_row.project_deadline THEN
            RAISE EXCEPTION 'The assessment deadline has passed.' USING ERRCODE = 'P0001';
        END IF;
        IF coalesce(btrim(repository), '') = '' AND coalesce(btrim(live), '') = '' THEN
            RAISE EXCEPTION 'Add a repository or a link to your work before submitting.'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    INSERT INTO public.assessment_submissions (
        application_id, project_id, candidate_id, status,
        repository_url, live_url, notes, completed_requirements, submitted_at
    )
    VALUES (
        application_row.id, project_row.id, candidate,
        CASE WHEN submit THEN 'submitted' ELSE 'in_progress' END,
        nullif(btrim(repository), ''), nullif(btrim(live), ''), nullif(btrim(note), ''),
        checked,
        CASE WHEN submit THEN now() END
    )
    ON CONFLICT (application_id) DO UPDATE SET
        status = EXCLUDED.status,
        repository_url = EXCLUDED.repository_url,
        live_url = EXCLUDED.live_url,
        notes = EXCLUDED.notes,
        completed_requirements = EXCLUDED.completed_requirements,
        submitted_at = EXCLUDED.submitted_at,
        updated_at = now();

    RETURN CASE WHEN submit THEN 'submitted' ELSE 'in_progress' END;
END;
$$;

REVOKE ALL ON FUNCTION public.save_assessment(UUID, TEXT, TEXT, TEXT, INTEGER[], BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_assessment(UUID, TEXT, TEXT, TEXT, INTEGER[], BOOLEAN) TO authenticated;

-- 4. Tell the company when an assessment comes in --------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_assessment_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_title TEXT;
BEGIN
    IF NEW.status = 'submitted'
        AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'submitted') THEN
        SELECT title INTO role_title FROM public.projects WHERE id = NEW.project_id;
        PERFORM public.notify_project_company(
            NEW.project_id, 'work_submitted', 'Assessment submitted',
            public.candidate_display_name(NEW.candidate_id)
                || ' submitted the assessment for ' || role_title,
            '/company/projects/' || NEW.project_id || '/applicants/' || NEW.application_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_assessment_submitted ON public.assessment_submissions;
CREATE TRIGGER notify_on_assessment_submitted
    AFTER INSERT OR UPDATE OF status ON public.assessment_submissions
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_assessment_submitted();

-- 5. Hiring decisions wait for the work -------------------------------------------------------
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
        -- Hired on the work: nothing moves forward before the assessment is in.
        IF new_status IN ('reviewing', 'shortlisted', 'interview', 'selected')
            AND coalesce(btrim(project_row.assessment_title), '') <> ''
            AND NOT EXISTS (
                SELECT 1 FROM public.assessment_submissions s
                WHERE s.application_id = NEW.id AND s.status = 'submitted'
            ) THEN
            RAISE EXCEPTION 'Wait for the candidate to submit their assessment before moving them forward.'
                USING ERRCODE = 'P0001';
        END IF;

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

            -- The last opening: hiring is complete. Close the posting and give
            -- everyone still in the running a decision instead of silence.
            IF selected + 1 >= project_row.openings THEN
                UPDATE public.projects SET status = 'completed' WHERE id = NEW.project_id;
                UPDATE public.applications
                SET status = 'rejected',
                    decision_note = 'Every opening for this role has been filled. Thank you for taking part in the assessment.'
                WHERE project_id = NEW.project_id
                  AND id <> NEW.id
                  AND status::text IN ('submitted', 'reviewing', 'shortlisted', 'interview');
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

-- 6. History names the assessment ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.company_history(UUID);

CREATE FUNCTION public.company_history(target_company_id UUID)
RETURNS TABLE (
    project_id UUID,
    slug TEXT,
    title TEXT,
    opportunity_type TEXT,
    status TEXT,
    openings INTEGER,
    hired INTEGER,
    accepted INTEGER,
    applications INTEGER,
    payment_amount NUMERIC,
    currency TEXT,
    posted_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    assessment_title TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id,
        p.slug,
        p.title,
        p.opportunity_type,
        p.status::text,
        p.openings,
        (SELECT count(*)::int FROM public.applications a
          WHERE a.project_id = p.id AND a.status::text = 'selected'
            AND p.opportunity_type = 'hire'),
        (SELECT count(*)::int FROM public.project_selections s
          WHERE s.project_id = p.id AND s.status = 'completed'),
        (SELECT count(*)::int FROM public.applications a
          WHERE a.project_id = p.id AND a.status::text <> 'withdrawn'),
        p.payment_amount,
        p.currency,
        p.created_at,
        coalesce(p.closed_at, p.updated_at),
        p.assessment_title
    FROM public.projects p
    WHERE p.company_id = target_company_id
      AND p.status IN ('completed', 'cancelled')
    ORDER BY coalesce(p.closed_at, p.updated_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.company_history(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_history(UUID) TO authenticated;

COMMIT;
