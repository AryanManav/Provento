-- Company controls over its own projects: private/public, withdraw, delete.
--
-- 1. guard_project_status: companies could UPDATE a project's status to
--    anything (e.g. mark it completed with no evaluation, or reopen a finished
--    one). End-user sessions may now only:
--      applications_open/published → draft          (make private)
--      draft → applications_open                    (make public)
--      draft/published/applications_open → cancelled (withdraw)
--    Every other transition comes from the decision triggers, which run nested
--    (pg_trigger_depth() > 1) and pass through. The SQL editor is unaffected.
--    Once a candidate is selected, neither side can pull the project away.
-- 2. projects.withdrawal_reason, sent to every applicant when it's withdrawn.
-- 3. delete_project(): only while nobody has applied. After that, applications
--    are on record, so withdrawing is the way out.
--
-- Safe to re-run.

BEGIN;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_withdrawal_reason_length;
ALTER TABLE public.projects
    ADD CONSTRAINT projects_withdrawal_reason_length
    CHECK (withdrawal_reason IS NULL OR char_length(withdrawal_reason) <= 1000);

-- 1. Allowed manual transitions ------------------------------------------------
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

DROP TRIGGER IF EXISTS guard_project_status ON public.projects;
CREATE TRIGGER guard_project_status
    BEFORE UPDATE OF status ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.guard_project_status();

-- 2. Tell applicants when a project is withdrawn --------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_project_withdrawn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
        INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url)
        SELECT cp.user_id, NEW.id, 'application_status',
               'Project withdrawn: ' || NEW.title,
               left(coalesce(nullif(btrim(coalesce(NEW.withdrawal_reason, '')), ''),
                    'The startup withdrew this project. Your application is closed.'), 280),
               '/candidate/applications'
        FROM public.applications a
        JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
        WHERE a.project_id = NEW.id AND a.status <> 'withdrawn';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_project_withdrawn ON public.projects;
CREATE TRIGGER notify_on_project_withdrawn
    AFTER UPDATE OF status ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_withdrawn();

-- 3. Delete, only while untouched ------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_project(target_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owner_company UUID;
BEGIN
    SELECT company_id INTO owner_company FROM public.projects WHERE id = target_project_id;
    IF owner_company IS NULL
        OR NOT (public.is_company_member(owner_company) OR public.is_admin()) THEN
        RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
    END IF;

    IF EXISTS (SELECT 1 FROM public.applications WHERE project_id = target_project_id) THEN
        RAISE EXCEPTION 'Candidates have applied to this project, so it can''t be deleted — withdraw it instead.'
            USING ERRCODE = 'P0001';
    END IF;

    DELETE FROM public.projects WHERE id = target_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_project(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_project(UUID) TO authenticated;

COMMIT;
