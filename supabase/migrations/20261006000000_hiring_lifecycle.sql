-- Hiring lifecycle and company history.
--
-- The hire-only rules already hold in the database (20261005000000_hire_only):
-- an application is refused at the limit, a withdrawal frees its slot, and
-- filling the last opening completes the posting, which takes it out of
-- Browse. This adds what the history needs:
--
-- 1. projects.closed_at: when an opportunity completed or was closed. Set by a
--    trigger on every update, so neither a company nor a client can write it.
-- 2. Closing a hire posting ("Close hiring") only notifies candidates still in
--    the running — never those already hired or turned down.
-- 3. company_history(): every finished opportunity of a company — completed,
--    closed or withdrawn — with its openings, hires and application count.
--    Counts and titles only; who was hired stays private to the company.
--
-- Safe to re-run.

BEGIN;

-- 1. When an opportunity finished --------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.stamp_project_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.status IN ('completed', 'cancelled') THEN
        NEW.closed_at := CASE
            WHEN OLD.status IS DISTINCT FROM NEW.status THEN now()
            ELSE OLD.closed_at
        END;
    ELSE
        -- Reopened (e.g. a build project after rejected work) or never closed.
        NEW.closed_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_project_closed ON public.projects;
CREATE TRIGGER stamp_project_closed
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.stamp_project_closed();

-- Finished before this migration: the last update is the best record there is.
UPDATE public.projects
SET closed_at = updated_at
WHERE status IN ('completed', 'cancelled') AND closed_at IS NULL;

-- 2. Closing hiring tells only the candidates still waiting -------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_project_withdrawn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hire BOOLEAN := NEW.opportunity_type = 'hire';
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
        INSERT INTO public.notifications (user_id, project_id, type, title, message, link_url)
        SELECT cp.user_id, NEW.id, 'application_status',
               CASE WHEN hire THEN 'Hiring closed: ' ELSE 'Project withdrawn: ' END || NEW.title,
               left(coalesce(nullif(btrim(coalesce(NEW.withdrawal_reason, '')), ''),
                    CASE WHEN hire
                        THEN 'The startup closed hiring for this role. Your application is closed.'
                        ELSE 'The startup withdrew this project. Your application is closed.'
                    END), 280),
               '/candidate/applications'
        FROM public.applications a
        JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
        WHERE a.project_id = NEW.id
          AND a.status::text <> 'withdrawn'
          AND (NOT hire OR a.status::text NOT IN ('selected', 'rejected'));
    END IF;
    RETURN NEW;
END;
$$;

-- 3. A company's finished opportunities ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_history(target_company_id UUID)
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
    closed_at TIMESTAMPTZ
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
        coalesce(p.closed_at, p.updated_at)
    FROM public.projects p
    WHERE p.company_id = target_company_id
      AND p.status IN ('completed', 'cancelled')
    ORDER BY coalesce(p.closed_at, p.updated_at) DESC;
$$;

REVOKE ALL ON FUNCTION public.company_history(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_history(UUID) TO authenticated;

COMMIT;
