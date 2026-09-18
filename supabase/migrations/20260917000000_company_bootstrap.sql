-- Creating a company and its first owner row cannot be done by the caller alone:
-- the company_members RLS policy requires an existing membership, so the very
-- first owner row is always rejected. That previously forced the application to
-- reach for the service-role key on a request path, bypassing RLS entirely.
--
-- This function performs both writes atomically as the definer, while still
-- enforcing that the caller is authenticated and does not already own a company.

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
    company_name text,
    company_website text DEFAULT NULL,
    company_description text DEFAULT NULL,
    company_industry text DEFAULT NULL,
    company_size text DEFAULT NULL,
    company_location text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id uuid := auth.uid();
    new_company_id uuid;
BEGIN
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = caller_id) THEN
        RAISE EXCEPTION 'User already belongs to a company';
    END IF;

    IF company_name IS NULL OR length(trim(company_name)) < 2 THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;

    INSERT INTO public.companies (
        name, website, description, industry, company_size, location
    )
    VALUES (
        trim(company_name),
        company_website,
        company_description,
        company_industry,
        company_size,
        company_location
    )
    RETURNING id INTO new_company_id;

    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (new_company_id, caller_id, 'owner');

    RETURN new_company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_company_with_owner(
    text, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_company_with_owner(
    text, text, text, text, text, text
) TO authenticated;
