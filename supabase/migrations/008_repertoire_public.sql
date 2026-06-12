-- Публичный репертуар (список треков для заказчиков)

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS repertoire_public BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_public_repertoire(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'genre', b.genre,
    'songs', COALESCE((
      SELECT json_agg(
        json_build_object(
          'title', s.title,
          'status', s.status,
          'song_type', s.song_type,
          'key', s.key,
          'bpm', s.bpm,
          'duration_sec', s.duration_sec,
          'genre', s.genre
        )
        ORDER BY s.sort_order, s.title
      )
      FROM public.songs s
      WHERE s.band_id = b.id
    ), '[]'::json)
  )
  FROM public.bands b
  WHERE b.slug = p_slug AND b.repertoire_public = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
