-- Каталог публичных групп для главной страницы (заказчики)

CREATE OR REPLACE FUNCTION public.get_public_bands_catalog()
RETURNS JSON AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'name', b.name,
        'slug', b.slug,
        'description', b.description,
        'genre', b.genre,
        'tracks_count', (
          SELECT count(*)::int FROM public.songs s WHERE s.band_id = b.id
        ),
        'members_count', (
          SELECT count(*)::int FROM public.band_members m
          WHERE m.band_id = b.id AND m.is_active = true
        ),
        'rider_public', b.rider_public,
        'repertoire_public', COALESCE(b.repertoire_public, false)
      )
      ORDER BY b.name
    ),
    '[]'::json
  )
  FROM public.bands b
  WHERE b.rider_public = true OR COALESCE(b.repertoire_public, false) = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
