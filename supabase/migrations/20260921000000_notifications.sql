-- In-app notifications for the application loop.
--
-- Every notification is written by a trigger on the table where the event
-- happens, never by a client: users can only read their own rows and flip
-- `read`. That keeps the feed trustworthy — nobody can forge an alert, and
-- `link_url` is always a path this migration built.
--
-- Safe to re-run.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Table: tie each notification to a project so cards can be highlighted
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_project
    ON public.notifications(user_id, project_id) WHERE NOT read;

-- ----------------------------------------------------------------------------
-- 2. Access: read your own, mark them read — nothing else
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only view and update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users mark own notifications read" ON public.notifications;

CREATE POLICY "Users read own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users mark own notifications read"
    ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Column-level: an UPDATE may only touch `read`, so a user can't rewrite the
-- title or link of an alert they received.
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Internal helpers (not callable over the API)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_user(
    target_user_id UUID,
    target_project_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_message TEXT,
    notification_link TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url)
    SELECT target_user_id, target_project_id, notification_type, notification_title,
           left(notification_message, 280), notification_link
    WHERE target_user_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_company(
    target_project_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_message TEXT,
    notification_link TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url)
    SELECT cm.user_id, p.id, notification_type, notification_title,
           left(notification_message, 280), notification_link
    FROM public.projects p
    JOIN public.company_members cm ON cm.company_id = p.company_id
    WHERE p.id = target_project_id;
$$;

CREATE OR REPLACE FUNCTION public.candidate_user_id(target_candidate_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT user_id FROM public.candidate_profiles WHERE id = target_candidate_id;
$$;

CREATE OR REPLACE FUNCTION public.candidate_display_name(target_candidate_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT coalesce(nullif(btrim(u.full_name), ''), 'A candidate')
    FROM public.candidate_profiles cp
    JOIN public.users u ON u.id = cp.user_id
    WHERE cp.id = target_candidate_id;
$$;

REVOKE ALL ON FUNCTION public.notify_user(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_project_company(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.candidate_user_id(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.candidate_display_name(UUID) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Triggers
-- ----------------------------------------------------------------------------

-- Applications: new ones alert the company; status changes alert the candidate,
-- except a withdrawal, which is the candidate's own act and alerts the company.
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
    candidate_name TEXT;
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
            'application_status', 'You were selected',
            'Start building ' || project_title || ' — the brief and workspace are ready.',
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
            project_title,
            '/candidate/applications');
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_application ON public.applications;
CREATE TRIGGER notify_on_application
    AFTER INSERT OR UPDATE OF status ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();

-- Submissions: new work alerts the company; the company's decision alerts the
-- candidate.
CREATE OR REPLACE FUNCTION public.notify_on_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
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
            WHEN 'revision_requested' THEN 'Revision requested'
            WHEN 'accepted' THEN 'Submission accepted'
            ELSE 'Submission not accepted'
        END,
        project_title,
        '/candidate/trials/' || NEW.project_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_submission ON public.project_submissions;
CREATE TRIGGER notify_on_submission
    AFTER INSERT OR UPDATE OF status ON public.project_submissions
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_submission();

-- Clarification messages alert the other side of the thread.
CREATE OR REPLACE FUNCTION public.notify_on_project_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
    company_name TEXT;
BEGIN
    SELECT p.title, c.name INTO project_title, company_name
    FROM public.projects p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = NEW.project_id;

    IF NEW.author_role = 'candidate' THEN
        PERFORM public.notify_project_company(
            NEW.project_id, 'message',
            'Question from ' || public.candidate_display_name(NEW.candidate_id),
            NEW.body,
            '/company/projects/' || NEW.project_id || '/review');
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

DROP TRIGGER IF EXISTS notify_on_project_message ON public.project_messages;
CREATE TRIGGER notify_on_project_message
    AFTER INSERT ON public.project_messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_message();

-- Written feedback and the final outcome alert the candidate.
CREATE OR REPLACE FUNCTION public.notify_on_evaluation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_title TEXT;
BEGIN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;

    PERFORM public.notify_user(
        public.candidate_user_id(NEW.candidate_id), NEW.project_id,
        CASE TG_TABLE_NAME WHEN 'project_feedback' THEN 'feedback' ELSE 'outcome' END,
        CASE TG_TABLE_NAME WHEN 'project_feedback' THEN 'Feedback received' ELSE 'Final outcome recorded' END,
        project_title,
        '/candidate/trials/' || NEW.project_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_feedback ON public.project_feedback;
CREATE TRIGGER notify_on_feedback
    AFTER INSERT ON public.project_feedback
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_evaluation();

DROP TRIGGER IF EXISTS notify_on_outcome ON public.project_outcomes;
CREATE TRIGGER notify_on_outcome
    AFTER INSERT ON public.project_outcomes
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_evaluation();

-- ----------------------------------------------------------------------------
-- 5. Backfill what is already waiting on a company, once
-- ----------------------------------------------------------------------------
INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url, created_at)
SELECT cm.user_id, a.project_id, 'application_received', 'New applicant',
       public.candidate_display_name(a.candidate_id) || ' applied to ' || p.title,
       '/company/projects/' || a.project_id || '/applicants/' || a.id,
       a.created_at
FROM public.applications a
JOIN public.projects p ON p.id = a.project_id
JOIN public.company_members cm ON cm.company_id = p.company_id
WHERE a.status = 'submitted'
  AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = cm.user_id
        AND n.link_url = '/company/projects/' || a.project_id || '/applicants/' || a.id
  );

INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url, created_at)
SELECT cm.user_id, s.project_id, 'work_submitted', 'Work submitted',
       public.candidate_display_name(s.candidate_id) || ' submitted work for ' || p.title,
       '/company/projects/' || s.project_id || '/review',
       s.submitted_at
FROM public.project_submissions s
JOIN public.projects p ON p.id = s.project_id
JOIN public.company_members cm ON cm.company_id = p.company_id
WHERE s.status = 'submitted'
  AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = cm.user_id
        AND n.type = 'work_submitted'
        AND n.project_id = s.project_id
  );

COMMIT;
