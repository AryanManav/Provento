-- Profile images: the avatar lives on public.users.avatar_url (it already
-- exists and follows the account everywhere, including the navbar); the banner
-- is candidate-specific.

ALTER TABLE public.candidate_profiles
    ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Public read so images render with a plain <img>; size and type are enforced
-- here, server side, not just by the upload form.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-media',
    'profile-media',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Each user may only write inside a folder named after their own id:
--   profile-media/<auth.uid()>/avatar
--   profile-media/<auth.uid()>/banner

DROP POLICY IF EXISTS "Users upload their own profile media" ON storage.objects;
CREATE POLICY "Users upload their own profile media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users replace their own profile media" ON storage.objects;
CREATE POLICY "Users replace their own profile media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users delete their own profile media" ON storage.objects;
CREATE POLICY "Users delete their own profile media"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Uploads use upsert, which needs to read the existing object.
DROP POLICY IF EXISTS "Users read their own profile media" ON storage.objects;
CREATE POLICY "Users read their own profile media"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'profile-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
