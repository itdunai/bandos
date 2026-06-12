-- Профиль группы: описание, жанр, техрайдер, соцсети

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS genre TEXT,
  ADD COLUMN IF NOT EXISTS tech_rider TEXT,
  ADD COLUMN IF NOT EXISTS rider_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Публичный просмотр профиля / техрайдера (для шаринга)
CREATE POLICY "Public can view bands with public rider"
  ON public.bands FOR SELECT
  USING (rider_public = true);

-- Публичные данные группы (без авторизации)
CREATE OR REPLACE FUNCTION public.get_public_band(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', b.description,
    'genre', b.genre,
    'tech_rider', b.tech_rider,
    'social_links', b.social_links,
    'tracks_count', (
      SELECT count(*)::int FROM public.songs s WHERE s.band_id = b.id
    ),
    'members_count', (
      SELECT count(*)::int FROM public.band_members m
      WHERE m.band_id = b.id AND m.is_active = true
    )
  )
  FROM public.bands b
  WHERE b.slug = p_slug AND b.rider_public = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
