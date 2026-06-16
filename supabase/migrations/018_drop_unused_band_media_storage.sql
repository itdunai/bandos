-- Удаление неиспользуемого Supabase Storage bucket band-media
-- (приложение хранит картинки на диске, см. UPLOAD_DIR / /media/...)
-- Безопасно, если bucket не создавался (старая 016 без Storage).

DROP POLICY IF EXISTS "band_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_insert" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_update" ON storage.objects;
DROP POLICY IF EXISTS "band_media_avatar_delete" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_insert" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_update" ON storage.objects;
DROP POLICY IF EXISTS "band_media_band_delete" ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'band-media';
