-- A company's public track record, as counts only.
--
-- Candidates deciding whether to do paid work for a startup should see how it
-- has treated past evaluations: how many it finished, and how many led to a
-- hire or an interview. Outcome rows are private to the candidate and the
-- company (RLS), so this SECURITY DEFINER function returns aggregates only —
-- never who was evaluated or what any individual outcome was.
--
-- Safe to re-run.

BEGIN;

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
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id AND p.status = 'completed'),
        (SELECT count(DISTINCT o.project_id)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'hire'),
        (SELECT count(DISTINCT o.project_id)::int FROM public.project_outcomes o
           JOIN public.projects p ON p.id = o.project_id
          WHERE p.company_id = target_company_id AND o.outcome = 'interview'),
        (SELECT count(*)::int FROM public.projects p
          WHERE p.company_id = target_company_id AND p.status = 'cancelled');
$$;

REVOKE ALL ON FUNCTION public.company_track_record(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_track_record(UUID) TO authenticated;

COMMIT;
