-- Контакты для связи (имя + телефон) на странице группы

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.get_public_band_page(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', b.description,
    'genre', b.genre,
    'city', b.city,
    'logo_url', b.logo_url,
    'photos', COALESCE(b.photos, '[]'::jsonb),
    'rider_public', b.rider_public,
    'repertoire_public', COALESCE(b.repertoire_public, false),
    'tech_rider', b.tech_rider,
    'social_links', b.social_links,
    'contacts', COALESCE(b.contacts, '[]'::jsonb),
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
    END,
    'releases', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'title', r.title,
          'released_at', r.released_at,
          'cover_url', r.cover_url,
          'links', COALESCE((
            SELECT json_agg(
              json_build_object(
                'platform', rl.platform,
                'url', rl.url
              )
              ORDER BY rl.platform
            )
            FROM public.release_links rl
            WHERE rl.release_id = r.id
          ), '[]'::json)
        )
        ORDER BY r.released_at DESC
      )
      FROM (
        SELECT *
        FROM public.releases rel
        WHERE rel.band_id = b.id
        ORDER BY rel.released_at DESC
        LIMIT 6
      ) r
    ), '[]'::json)
  )
  FROM public.bands b
  WHERE b.slug = p_slug
    AND (b.rider_public = true OR COALESCE(b.repertoire_public, false) = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
