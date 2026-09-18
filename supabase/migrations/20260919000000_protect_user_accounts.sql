-- Close a privilege escalation in public.users.
--
-- "Users can update their own record" allows UPDATE on any column of the
-- caller's own row, and public.is_admin() trusts users.role. Any signed-in user
-- could therefore run, from the browser with the public anon key:
--
--     supabase.from('users').update({ role: 'admin' }).eq('id', <own id>)
--
-- and pass every `OR public.is_admin()` policy in the schema. The permissive
-- INSERT policy (no TO clause, WITH CHECK (true)) likewise lets anon create
-- arbitrary rows, including role = 'admin'.
--
-- A trigger guards the columns rather than narrowing the policies, because the
-- legitimate writers never arrive as an end-user session: the signup trigger is
-- SECURITY DEFINER inside GoTrue's connection, the signup backfill uses the
-- service-role key, and the SQL editor runs with no JWT. auth.role() is
-- 'anon' / 'authenticated' only for requests made with a user or anon key, so
-- only those are restricted.

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
        OR NEW.role IS DISTINCT FROM OLD.role
        OR NEW.email IS DISTINCT FROM OLD.email
        OR NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
        RAISE EXCEPTION 'Account role, email and verification cannot be changed here'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_account_fields ON public.users;
CREATE TRIGGER protect_user_account_fields
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_account_fields();

-- The update policy also lacked WITH CHECK, so a row could be rewritten to
-- belong to someone else. Pin the new row to the caller too.
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record"
    ON public.users FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
