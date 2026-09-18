-- Self-service account deletion.
--
-- 1. References that recorded *who acted* (selected a candidate, wrote an
--    evaluation, posted a message, wrote an admin note) had no ON DELETE rule,
--    so deleting any user who had ever acted failed. They now become NULL: the
--    record stays, the person is gone.
-- 2. account_deletion_blockers() lists why the current user can't delete yet —
--    only while a candidate is mid-project, so neither side strands the other.
-- 3. delete_my_account() re-checks those blockers, closes the open projects of
--    a company whose last member is leaving (the company and its finished
--    evaluations stay, so candidates keep their verified history), then
--    deletes the auth user. Everything personal cascades from there.
--
-- Safe to re-run.

BEGIN;

-- 1. "Who acted" references survive the actor's deletion ----------------------
ALTER TABLE public.project_selections ALTER COLUMN selected_by DROP NOT NULL;
ALTER TABLE public.project_selections
    DROP CONSTRAINT IF EXISTS project_selections_selected_by_fkey;
ALTER TABLE public.project_selections
    ADD CONSTRAINT project_selections_selected_by_fkey
    FOREIGN KEY (selected_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.project_feedback ALTER COLUMN reviewer_id DROP NOT NULL;
ALTER TABLE public.project_feedback
    DROP CONSTRAINT IF EXISTS project_feedback_reviewer_id_fkey;
ALTER TABLE public.project_feedback
    ADD CONSTRAINT project_feedback_reviewer_id_fkey
    FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.project_messages ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.project_messages
    DROP CONSTRAINT IF EXISTS project_messages_author_id_fkey;
ALTER TABLE public.project_messages
    ADD CONSTRAINT project_messages_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.admin_notes ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.admin_notes
    DROP CONSTRAINT IF EXISTS admin_notes_admin_id_fkey;
ALTER TABLE public.admin_notes
    ADD CONSTRAINT admin_notes_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. What stops the current user deleting right now ---------------------------
CREATE OR REPLACE FUNCTION public.account_deletion_blockers()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT coalesce(array_agg(reason), '{}')
    FROM (
        -- A candidate in the middle of a trial.
        SELECT 'You''re working on "' || p.title || '". Submit it and wait for the '
               || 'startup''s decision, or ask them to close it, first.' AS reason
        FROM public.project_selections s
        JOIN public.candidate_profiles cp ON cp.id = s.candidate_id
        JOIN public.projects p ON p.id = s.project_id
        WHERE cp.user_id = auth.uid()
          AND p.status NOT IN ('completed', 'cancelled')

        UNION ALL

        -- The last member of a company while a candidate is working for it.
        SELECT 'A candidate is working on "' || p.title || '". Accept their work '
               || 'or close the project first.'
        FROM public.company_members m
        JOIN public.projects p ON p.company_id = m.company_id
        WHERE m.user_id = auth.uid()
          AND NOT EXISTS (
              SELECT 1 FROM public.company_members other
              WHERE other.company_id = m.company_id AND other.user_id <> auth.uid()
          )
          AND p.status IN ('candidate_selected', 'in_progress', 'submitted',
                           'under_review', 'revision_requested')

        UNION ALL

        SELECT 'Admin accounts are removed by hand.' WHERE public.is_admin()
    ) reasons;
$$;

-- 3. Delete the signed-in user ------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID := auth.uid();
    blockers TEXT[];
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
    END IF;

    blockers := public.account_deletion_blockers();
    IF coalesce(array_length(blockers, 1), 0) > 0 THEN
        RAISE EXCEPTION '%', blockers[1] USING ERRCODE = 'P0001';
    END IF;

    -- Nobody should apply to a company with no one left behind it.
    UPDATE public.projects p
    SET status = 'cancelled'
    WHERE p.status IN ('draft', 'pending_review', 'published', 'applications_open')
      AND p.company_id IN (
          SELECT m.company_id FROM public.company_members m
          WHERE m.user_id = uid
            AND NOT EXISTS (
                SELECT 1 FROM public.company_members other
                WHERE other.company_id = m.company_id AND other.user_id <> uid
            )
      );

    -- Cascades to public.users and from there to the candidate profile,
    -- applications, submissions, messages, notifications and memberships.
    DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.account_deletion_blockers() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_deletion_blockers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

COMMIT;
