-- Логотип и фото группы, storage для аватаров и медиа

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;

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

-- Публичный репертуар: только треки со статусом «Готова»
CREATE OR REPLACE FUNCTION public.get_public_band_page(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', b.description,
    'genre', b.genre,
    'logo_url', b.logo_url,
    'photos', COALESCE(b.photos, '[]'::jsonb),
    'rider_public', b.rider_public,
    'repertoire_public', COALESCE(b.repertoire_public, false),
    'tech_rider', b.tech_rider,
    'social_links', b.social_links,
    'tracks_count', (
      SELECT count(*)::int FROM public.songs s
      WHERE s.band_id = b.id AND s.status = 'ready'
    ),
    'members_count', (
      SELECT count(*)::int FROM public.band_members m
      WHERE m.band_id = b.id AND m.is_active = true
    ),
    'songs', CASE
      WHEN COALESCE(b.repertoire_public, false) THEN COALESCE((
        SELECT json_agg(
          json_build_object(
            'title', s.title,
            'song_type', s.song_type,
            'duration_sec', s.duration_sec
          )
          ORDER BY s.sort_order, s.title
        )
        FROM public.songs s
        WHERE s.band_id = b.id AND s.status = 'ready'
      ), '[]'::json)
      ELSE '[]'::json
    END
  )
  FROM public.bands b
  WHERE b.slug = p_slug
    AND (b.rider_public = true OR COALESCE(b.repertoire_public, false) = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
