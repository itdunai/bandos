-- BandOS: granular member permissions + presets

ALTER TABLE public.band_members
  ADD COLUMN IF NOT EXISTS permission_preset TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS permission_preset TEXT DEFAULT 'musician',
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill existing members
UPDATE public.band_members
SET
  permission_preset = 'manager',
  permissions = '{"songs":true,"setlists":true,"schedule":true,"todos":true,"band_profile":true}'::jsonb
WHERE role = 'manager' AND permissions = '{}'::jsonb;

UPDATE public.band_members
SET permission_preset = 'musician', permissions = '{}'::jsonb
WHERE role IN ('member', 'session')
  AND (permission_preset IS NULL OR permissions = '{}'::jsonb);

UPDATE public.band_members
SET permission_preset = 'custom', permissions = '{}'::jsonb
WHERE role = 'admin' AND permission_preset IS NULL;

-- ---------------------------------------------------------------------------
-- Permission helper (admin role = full access)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.member_has_permission(
  p_band_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members bm
    WHERE bm.band_id = p_band_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND (
        bm.role = 'admin'
        OR COALESCE((bm.permissions ->> p_permission)::boolean, false) = true
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- RLS: split read vs write by permission
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members access band songs" ON public.songs;
CREATE POLICY "Members read band songs"
  ON public.songs FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));
CREATE POLICY "Members insert band songs"
  ON public.songs FOR INSERT
  WITH CHECK (public.member_has_permission(band_id, 'songs'));
CREATE POLICY "Members update band songs"
  ON public.songs FOR UPDATE
  USING (public.member_has_permission(band_id, 'songs'));
CREATE POLICY "Members delete band songs"
  ON public.songs FOR DELETE
  USING (public.member_has_permission(band_id, 'songs'));

DROP POLICY IF EXISTS "Members access song contents" ON public.song_contents;
CREATE POLICY "Members read song contents"
  ON public.song_contents FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM public.songs
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );
CREATE POLICY "Members write song contents"
  ON public.song_contents FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );
CREATE POLICY "Members update song contents"
  ON public.song_contents FOR UPDATE
  USING (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );
CREATE POLICY "Members delete song contents"
  ON public.song_contents FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );

DROP POLICY IF EXISTS "Members access song_members" ON public.song_members;
CREATE POLICY "Members read song_members"
  ON public.song_members FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM public.songs
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );
CREATE POLICY "Members insert song_members"
  ON public.song_members FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );
CREATE POLICY "Members update song_members"
  ON public.song_members FOR UPDATE
  USING (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );
CREATE POLICY "Members delete song_members"
  ON public.song_members FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM public.songs s
      WHERE public.member_has_permission(s.band_id, 'songs')
    )
  );

DROP POLICY IF EXISTS "Members access setlists" ON public.setlists;
CREATE POLICY "Members read setlists"
  ON public.setlists FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));
CREATE POLICY "Members insert setlists"
  ON public.setlists FOR INSERT
  WITH CHECK (public.member_has_permission(band_id, 'setlists'));
CREATE POLICY "Members update setlists"
  ON public.setlists FOR UPDATE
  USING (public.member_has_permission(band_id, 'setlists'));
CREATE POLICY "Members delete setlists"
  ON public.setlists FOR DELETE
  USING (public.member_has_permission(band_id, 'setlists'));

DROP POLICY IF EXISTS "Members access setlist_items" ON public.setlist_items;
CREATE POLICY "Members read setlist_items"
  ON public.setlist_items FOR SELECT
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );
CREATE POLICY "Members write setlist_items"
  ON public.setlist_items FOR ALL
  USING (
    setlist_id IN (
      SELECT id FROM public.setlists sl
      WHERE public.member_has_permission(sl.band_id, 'setlists')
    )
  )
  WITH CHECK (
    setlist_id IN (
      SELECT id FROM public.setlists sl
      WHERE public.member_has_permission(sl.band_id, 'setlists')
    )
  );

DROP POLICY IF EXISTS "Members access events" ON public.events;
CREATE POLICY "Members read events"
  ON public.events FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));
CREATE POLICY "Members insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.member_has_permission(band_id, 'schedule'));
CREATE POLICY "Members update events"
  ON public.events FOR UPDATE
  USING (public.member_has_permission(band_id, 'schedule'));
CREATE POLICY "Members delete events"
  ON public.events FOR DELETE
  USING (public.member_has_permission(band_id, 'schedule'));

DROP POLICY IF EXISTS "Members access event_attendance" ON public.event_attendance;
CREATE POLICY "Members access event_attendance"
  ON public.event_attendance FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE band_id IN (SELECT public.user_band_ids())
    )
  );

DROP POLICY IF EXISTS "Members access todos" ON public.todos;
CREATE POLICY "Members read todos"
  ON public.todos FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));
CREATE POLICY "Members insert todos"
  ON public.todos FOR INSERT
  WITH CHECK (public.member_has_permission(band_id, 'todos'));
CREATE POLICY "Members update todos"
  ON public.todos FOR UPDATE
  USING (public.member_has_permission(band_id, 'todos'));
CREATE POLICY "Members delete todos"
  ON public.todos FOR DELETE
  USING (public.member_has_permission(band_id, 'todos'));

DROP POLICY IF EXISTS "Members can view their bands" ON public.bands;
DROP POLICY IF EXISTS "Admins can update their bands" ON public.bands;
CREATE POLICY "Members read their bands"
  ON public.bands FOR SELECT
  USING (id IN (SELECT public.user_band_ids()));
CREATE POLICY "Members update band profile"
  ON public.bands FOR UPDATE
  USING (public.member_has_permission(id, 'band_profile'));

-- Members may edit own contact fields; admins edit everything
DROP POLICY IF EXISTS "Admins can update members" ON public.band_members;
CREATE POLICY "Admins can update members"
  ON public.band_members FOR UPDATE
  USING (public.is_band_admin(band_id));
CREATE POLICY "Members update own profile"
  ON public.band_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Invitations & accept: carry permissions into membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', i.id,
    'token', i.token,
    'email', i.email,
    'role', i.role,
    'instrument', i.instrument,
    'permission_preset', COALESCE(i.permission_preset, 'musician'),
    'permissions', COALESCE(i.permissions, '{}'::jsonb),
    'band_name', b.name,
    'band_slug', b.slug
  )
  FROM public.invitations i
  JOIN public.bands b ON b.id = i.band_id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
  v_member_id UUID;
  v_user_email TEXT;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_inv.email IS NOT NULL THEN
    SELECT lower(email) INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF v_user_email IS NULL OR v_user_email <> lower(v_inv.email) THEN
      RAISE EXCEPTION 'Invitation email does not match your account';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = v_inv.band_id AND user_id = auth.uid()
  ) THEN
    UPDATE public.invitations
    SET accepted_at = now(), accepted_by = auth.uid()
    WHERE id = v_inv.id;
    RETURN v_inv.band_id;
  END IF;

  INSERT INTO public.band_members (
    band_id, user_id, role, instrument, display_name,
    permission_preset, permissions
  )
  VALUES (
    v_inv.band_id,
    auth.uid(),
    'member',
    v_inv.instrument,
    (SELECT display_name FROM public.profiles WHERE id = auth.uid()),
    COALESCE(v_inv.permission_preset, 'musician'),
    COALESCE(v_inv.permissions, '{}'::jsonb)
  )
  RETURNING id INTO v_member_id;

  UPDATE public.invitations
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_inv.id;

  RETURN v_inv.band_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
