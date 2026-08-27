-- BandOS: commercial releases (singles from repertoire songs)

CREATE TABLE public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  released_at DATE NOT NULL DEFAULT CURRENT_DATE,
  cover_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_releases_band_date ON public.releases(band_id, released_at DESC);
CREATE INDEX idx_releases_song ON public.releases(song_id);

CREATE TRIGGER releases_updated_at
  BEFORE UPDATE ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.release_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT release_links_platform_check CHECK (
    platform IN (
      'spotify',
      'apple_music',
      'yandex_music',
      'vk_music',
      'youtube_music',
      'bandcamp',
      'zvuk',
      'other'
    )
  ),
  CONSTRAINT release_links_unique_platform UNIQUE (release_id, platform)
);

CREATE INDEX idx_release_links_release ON public.release_links(release_id);

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read releases"
  ON public.releases FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));

CREATE POLICY "Members insert releases"
  ON public.releases FOR INSERT
  WITH CHECK (public.member_has_permission(band_id, 'songs'));

CREATE POLICY "Members update releases"
  ON public.releases FOR UPDATE
  USING (public.member_has_permission(band_id, 'songs'));

CREATE POLICY "Members delete releases"
  ON public.releases FOR DELETE
  USING (public.member_has_permission(band_id, 'songs'));

CREATE POLICY "Members read release_links"
  ON public.release_links FOR SELECT
  USING (
    release_id IN (
      SELECT id FROM public.releases
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

CREATE POLICY "Members write release_links"
  ON public.release_links FOR ALL
  USING (
    release_id IN (
      SELECT id FROM public.releases r
      WHERE public.member_has_permission(r.band_id, 'songs')
    )
  )
  WITH CHECK (
    release_id IN (
      SELECT id FROM public.releases r
      WHERE public.member_has_permission(r.band_id, 'songs')
    )
  );
