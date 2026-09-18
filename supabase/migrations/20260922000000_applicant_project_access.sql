-- Applicants keep access to the projects they applied to.
--
-- The public policy only exposes projects in published / applications_open /
-- candidate_selected / in_progress / completed. As soon as a selected candidate
-- submitted work the project moved to `submitted` (then `under_review` or
-- `revision_requested`) and vanished for them: Trial Projects dropped it, the
-- workspace 404'd — so a revision request could not even be acted on — and My
-- Applications showed an untitled card.
--
-- The check goes through a SECURITY DEFINER function because the applications
-- policies themselves read projects; querying applications directly from a
-- projects policy would recurse.
--
-- Safe to re-run.

BEGIN;

CREATE OR REPLACE FUNCTION public.has_applied_to_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
        WHERE a.project_id = target_project_id
          AND cp.user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.has_applied_to_project(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_applied_to_project(UUID) TO authenticated;

DROP POLICY IF EXISTS "Applicants can view projects they applied to" ON public.projects;
CREATE POLICY "Applicants can view projects they applied to"
    ON public.projects FOR SELECT TO authenticated
    USING (public.has_applied_to_project(id));

COMMIT;
