-- BandOS: Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Helper: bands the current user belongs to
CREATE OR REPLACE FUNCTION public.user_band_ids()
RETURNS SETOF UUID AS $$
  SELECT band_id FROM public.band_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_band_admin(p_band_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = p_band_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Members can view bandmates profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT bm.user_id FROM public.band_members bm
      WHERE bm.band_id IN (SELECT public.user_band_ids())
    )
  );

-- Bands
CREATE POLICY "Members can view their bands"
  ON public.bands FOR SELECT
  USING (id IN (SELECT public.user_band_ids()));

CREATE POLICY "Authenticated users can create bands"
  ON public.bands FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their bands"
  ON public.bands FOR UPDATE
  USING (public.is_band_admin(id));

-- Band members
CREATE POLICY "Members can view band roster"
  ON public.band_members FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));

CREATE POLICY "Admins can insert members"
  ON public.band_members FOR INSERT
  WITH CHECK (public.is_band_admin(band_id) OR user_id = auth.uid());

CREATE POLICY "Admins can update members"
  ON public.band_members FOR UPDATE
  USING (public.is_band_admin(band_id));

CREATE POLICY "Admins can delete members"
  ON public.band_members FOR DELETE
  USING (public.is_band_admin(band_id));

-- Invitations
CREATE POLICY "Admins manage invitations"
  ON public.invitations FOR ALL
  USING (public.is_band_admin(band_id));

CREATE POLICY "Anyone can read invitation by token for accept flow"
  ON public.invitations FOR SELECT
  USING (true);

-- Songs
CREATE POLICY "Members access band songs"
  ON public.songs FOR ALL
  USING (band_id IN (SELECT public.user_band_ids()));

-- Song contents
CREATE POLICY "Members access song contents"
  ON public.song_contents FOR ALL
  USING (
    song_id IN (
      SELECT id FROM public.songs
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

-- Song members
CREATE POLICY "Members access song_members"
  ON public.song_members FOR ALL
  USING (
    song_id IN (
      SELECT id FROM public.songs
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

-- Setlists
CREATE POLICY "Members access setlists"
  ON public.setlists FOR ALL
  USING (band_id IN (SELECT public.user_band_ids()));

CREATE POLICY "Members access setlist_items"
  ON public.setlist_items FOR ALL
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

-- Events
CREATE POLICY "Members access events"
  ON public.events FOR ALL
  USING (band_id IN (SELECT public.user_band_ids()));

CREATE POLICY "Members access event_attendance"
  ON public.event_attendance FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

-- Todos
CREATE POLICY "Members access todos"
  ON public.todos FOR ALL
  USING (band_id IN (SELECT public.user_band_ids()));
