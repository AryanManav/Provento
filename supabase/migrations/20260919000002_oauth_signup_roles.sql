-- 1. Close admin self-registration.
--
-- handle_new_user read the role from raw_user_meta_data, which is whatever the
-- sign-up request sent. The app's form only offers candidate/company, but anyone
-- can call Supabase Auth directly with the public key:
--
--     supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })
--
-- and the old trigger created an admin. Admins are now only ever granted by hand
-- (SQL editor or service role). While rewriting it, also read the name/photo
-- keys OAuth providers use (Google: full_name/avatar_url, LinkedIn: name/picture).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    user_role_val public.user_role := 'candidate';
    full_name_val TEXT;
BEGIN
    IF (NEW.raw_user_meta_data->>'role') = 'company' THEN
        user_role_val := 'company';
    END IF;

    full_name_val := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.users (id, email, full_name, role, avatar_url, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        full_name_val,
        user_role_val,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        email_verified = EXCLUDED.email_verified,
        updated_at = timezone('utc'::text, now());

    IF user_role_val = 'candidate' THEN
        INSERT INTO public.candidate_profiles (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Let the one sanctioned role change through the account-field guard.
--
-- claim_signup_role (below) sets a transaction-local flag before changing the
-- role. Users cannot set that flag themselves: PostgREST does not expose
-- set_config, and the setting would not survive into another request anyway.

CREATE OR REPLACE FUNCTION public.protect_user_account_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.id IS DISTINCT FROM auth.uid() OR NEW.role = 'admin' THEN
            RAISE EXCEPTION 'Not allowed to create this account record'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
        OR (
            NEW.role IS DISTINCT FROM OLD.role
            AND coalesce(current_setting('provento.claiming_signup_role', true), '') <> 'on'
        ) THEN
        RAISE EXCEPTION 'Account role, email and verification cannot be changed here'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

-- 3. OAuth sign-up cannot carry the candidate/company choice the way the email
-- form does, so every OAuth account starts as a candidate. A brand-new account
-- may switch itself to company exactly once. Everything else — an older
-- account, one that has applied to a project, one that is already a company or
-- admin — keeps its role, so this cannot be used to change an established
-- account, and it never grants admin.

CREATE OR REPLACE FUNCTION public.claim_signup_role(requested_role text)
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_role_val public.user_role;
    created_at_val TIMESTAMPTZ;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
    END IF;

    IF requested_role NOT IN ('candidate', 'company') THEN
        RAISE EXCEPTION 'Unsupported role' USING ERRCODE = '22023';
    END IF;

    SELECT role, created_at INTO current_role_val, created_at_val
    FROM public.users
    WHERE id = auth.uid();

    IF current_role_val IS NULL THEN
        RAISE EXCEPTION 'Account not found' USING ERRCODE = 'P0002';
    END IF;

    IF requested_role = 'candidate'
        OR current_role_val <> 'candidate'
        OR created_at_val < now() - interval '10 minutes'
        OR EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.candidate_profiles cp ON cp.id = a.candidate_id
            WHERE cp.user_id = auth.uid()
        ) THEN
        RETURN current_role_val;
    END IF;

    PERFORM set_config('provento.claiming_signup_role', 'on', true);
    UPDATE public.users SET role = 'company' WHERE id = auth.uid();

    -- The sign-up trigger created an empty candidate profile; a company has none.
    DELETE FROM public.candidate_profiles WHERE user_id = auth.uid();

    RETURN 'company';
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_signup_role(text) TO authenticated;
