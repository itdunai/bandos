-- Единая публичная страница группы (профиль + райдер + репертуар)

CREATE OR REPLACE FUNCTION public.get_public_band_page(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', b.description,
    'genre', b.genre,
    'rider_public', b.rider_public,
    'repertoire_public', COALESCE(b.repertoire_public, false),
    'tech_rider', b.tech_rider,
    'social_links', b.social_links,
    'tracks_count', (
      SELECT count(*)::int FROM public.songs s WHERE s.band_id = b.id
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
        WHERE s.band_id = b.id
      ), '[]'::json)
      ELSE '[]'::json
    END
  )
  FROM public.bands b
  WHERE b.slug = p_slug
    AND (b.rider_public = true OR COALESCE(b.repertoire_public, false) = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
