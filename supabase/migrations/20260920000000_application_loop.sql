-- Completes apply → review → accept → build: applicant profile access, work
-- mode, submission files, a clarification thread, and withdrawal.
-- Safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. users: stop exposing every account to every signed-in user
-- -----------------------------------------------------------------------------
-- The original policy was USING (true). Anyone can sign up, so every email,
-- name and role was readable by anyone. A user row is now visible to its owner,
-- to admins, and to a company whose project that user applied to — which covers
-- every cross-user read the app performs (applicant lists, evaluations).
--
-- The check is a SECURITY DEFINER helper so evaluating it does not drag the RLS
-- of candidate_profiles/applications/projects into every users read.

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
        );
$$;

DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users visible to self, admins and applicant companies" ON public.users;
CREATE POLICY "Users visible to self, admins and applicant companies"
    ON public.users FOR SELECT TO authenticated
    USING (public.can_view_user(id));

-- -----------------------------------------------------------------------------
-- 2. How a project is built
-- -----------------------------------------------------------------------------
-- 'in_app' is recorded now so the data exists; the in-app editor ships only
-- when a pilot's task needs it.

DO $$ BEGIN
    CREATE TYPE public.project_work_mode AS ENUM ('local', 'in_app');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS work_mode public.project_work_mode NOT NULL DEFAULT 'local';

-- -----------------------------------------------------------------------------
-- 3. Files attached to a submission
-- -----------------------------------------------------------------------------
-- The repository stays required (its commit history is the evidence); files
-- carry what a repo can't: notebooks, reports, designs.

CREATE TABLE IF NOT EXISTS public.submission_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.project_submissions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
    content_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission
    ON public.submission_attachments(submission_id);

ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidate and company can view attachments" ON public.submission_attachments;
CREATE POLICY "Candidate and company can view attachments"
    ON public.submission_attachments FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.project_submissions s
            JOIN public.projects p ON p.id = s.project_id
            WHERE s.id = submission_attachments.submission_id
              AND (
                  s.candidate_id = public.get_current_candidate_id()
                  OR public.is_company_member(p.company_id)
                  OR public.is_admin()
              )
        )
    );

-- The path must sit in the submitting candidate's own folder for that project,
-- matching the storage policy below, so a row can never point at someone else's file.
DROP POLICY IF EXISTS "Candidates attach files to their own submissions" ON public.submission_attachments;
CREATE POLICY "Candidates attach files to their own submissions"
    ON public.submission_attachments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.project_submissions s
            WHERE s.id = submission_attachments.submission_id
              AND s.candidate_id = public.get_current_candidate_id()
              AND submission_attachments.storage_path
                  LIKE s.project_id::text || '/' || auth.uid()::text || '/%'
        )
    );

-- Private bucket: files are evidence, downloaded only through short-lived
-- signed URLs. No UPDATE or DELETE policy — once uploaded, a file stays as it was.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('submission-files', 'submission-files', false, 26214400)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Path: <project_id>/<auth.uid()>/<file>. Only the selected candidate may upload.
DROP POLICY IF EXISTS "Selected candidate uploads submission files" ON storage.objects;
CREATE POLICY "Selected candidate uploads submission files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'submission-files'
        AND (storage.foldername(name))[2] = auth.uid()::text
        AND EXISTS (
            SELECT 1
            FROM public.project_selections ps
            JOIN public.candidate_profiles cp ON cp.id = ps.candidate_id
            WHERE ps.project_id::text = (storage.foldername(name))[1]
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Candidate and company read submission files" ON storage.objects;
CREATE POLICY "Candidate and company read submission files"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'submission-files'
        AND (
            (storage.foldername(name))[2] = auth.uid()::text
            OR public.is_admin()
            OR EXISTS (
                SELECT 1
                FROM public.projects p
                WHERE p.id::text = (storage.foldername(name))[1]
                  AND public.is_company_member(p.company_id)
            )
        )
    );

-- -----------------------------------------------------------------------------
-- 4. Clarification thread between the selected candidate and the company
-- -----------------------------------------------------------------------------
-- Response times in this thread are evidence, so rows cannot be edited or
-- deleted, and the timestamp is set by the database, never by the client.

CREATE TABLE IF NOT EXISTS public.project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id),
    author_role TEXT NOT NULL CHECK (author_role IN ('candidate', 'company')),
    body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_messages_thread
    ON public.project_messages(project_id, candidate_id, created_at);

CREATE OR REPLACE FUNCTION public.stamp_project_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.created_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_project_message ON public.project_messages;
CREATE TRIGGER stamp_project_message
    BEFORE INSERT ON public.project_messages
    FOR EACH ROW EXECUTE FUNCTION public.stamp_project_message();

ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Thread participants read messages" ON public.project_messages;
CREATE POLICY "Thread participants read messages"
    ON public.project_messages FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.project_selections ps
            JOIN public.projects p ON p.id = ps.project_id
            WHERE ps.project_id = project_messages.project_id
              AND ps.candidate_id = project_messages.candidate_id
              AND (
                  ps.candidate_id = public.get_current_candidate_id()
                  OR public.is_company_member(p.company_id)
                  OR public.is_admin()
              )
        )
    );

DROP POLICY IF EXISTS "Thread participants post messages" ON public.project_messages;
CREATE POLICY "Thread participants post messages"
    ON public.project_messages FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.project_selections ps
            JOIN public.projects p ON p.id = ps.project_id
            WHERE ps.project_id = project_messages.project_id
              AND ps.candidate_id = project_messages.candidate_id
              AND (
                  (author_role = 'candidate'
                      AND ps.candidate_id = public.get_current_candidate_id())
                  OR (author_role = 'company'
                      AND public.is_company_member(p.company_id))
              )
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Candidate withdraws an application
-- -----------------------------------------------------------------------------
-- Candidates have no UPDATE on applications. Withdrawal is allowed only before
-- selection: after it a project_selections row and a live workspace exist.

CREATE OR REPLACE FUNCTION public.withdraw_application(target_application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_status public.application_status;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
    END IF;

    SELECT a.status INTO current_status
    FROM public.applications a
    WHERE a.id = target_application_id
      AND a.candidate_id = public.get_current_candidate_id();

    IF current_status IS NULL THEN
        RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
    END IF;

    IF current_status NOT IN ('submitted', 'reviewing', 'shortlisted') THEN
        RAISE EXCEPTION 'This application can no longer be withdrawn' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.applications
    SET status = 'withdrawn', updated_at = now()
    WHERE id = target_application_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. Verified GitHub username, for companies reviewing an applicant
-- -----------------------------------------------------------------------------
-- Read from Supabase's own record of linked accounts. A column on the profile
-- would be writable by the candidate and therefore spoofable.

CREATE OR REPLACE FUNCTION public.candidate_github_username(target_candidate_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_user UUID;
BEGIN
    SELECT user_id INTO target_user
    FROM public.candidate_profiles
    WHERE id = target_candidate_id;

    IF target_user IS NULL THEN
        RETURN NULL;
    END IF;

    IF NOT (
        target_user = auth.uid()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.projects p ON p.id = a.project_id
            WHERE a.candidate_id = target_candidate_id
              AND public.is_company_member(p.company_id)
        )
    ) THEN
        RETURN NULL;
    END IF;

    RETURN (
        SELECT COALESCE(
            i.identity_data->>'user_name',
            i.identity_data->>'preferred_username',
            i.identity_data->>'login'
        )
        FROM auth.identities i
        WHERE i.user_id = target_user AND i.provider = 'github'
        LIMIT 1
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. A submission moves its project to "submitted"
-- -----------------------------------------------------------------------------
-- The app used to do this from the candidate's session, but only company
-- members may UPDATE projects, so the write matched no rows and failed silently:
-- projects never reached "submitted". Doing it here also refuses submissions
-- while the project isn't accepting work, whichever client sends them.

CREATE OR REPLACE FUNCTION public.apply_project_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_status public.project_status;
BEGIN
    SELECT status INTO current_status
    FROM public.projects
    WHERE id = NEW.project_id
    FOR UPDATE;

    IF current_status IS NULL
        OR current_status NOT IN ('candidate_selected', 'in_progress', 'revision_requested') THEN
        RAISE EXCEPTION 'This project is not accepting submissions' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.projects SET status = 'submitted' WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_project_submission ON public.project_submissions;
CREATE TRIGGER apply_project_submission
    BEFORE INSERT ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.apply_project_submission();

-- -----------------------------------------------------------------------------
-- 8. Who may call the new functions
-- -----------------------------------------------------------------------------
-- 20260914000001 granted every routine in public to anon, and REVOKE ... FROM
-- PUBLIC does not undo an explicit grant, so revoke anon by name as well.

REVOKE ALL ON FUNCTION public.withdraw_application(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_application(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.candidate_github_username(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.candidate_github_username(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_signup_role(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_signup_role(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.can_view_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_user(UUID) TO authenticated;
