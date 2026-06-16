-- Supabase Storage для лого, фото группы и аватаров (загрузка через server actions)

DROP POLICY IF EXISTS "band_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_insert" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_update" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_delete" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_insert" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_update" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_delete" ON storage.objects;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'band-media',
  'band-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "band_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'band-media');

CREATE POLICY "band_media_avatar_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "band_media_avatar_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "band_media_avatar_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "band_media_band_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'bands'
    AND public.member_has_permission((storage.foldername(name))[2]::uuid, 'band_profile')
  );

CREATE POLICY "band_media_band_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'bands'
    AND public.member_has_permission((storage.foldername(name))[2]::uuid, 'band_profile')
  );

CREATE POLICY "band_media_band_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'band-media'
    AND (storage.foldername(name))[1] = 'bands'
    AND public.member_has_permission((storage.foldername(name))[2]::uuid, 'band_profile')
  );
