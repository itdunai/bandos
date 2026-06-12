-- BandOS: security hardening (RLS, RPC auth, public data leak)

-- ---------------------------------------------------------------------------
-- 1. Fix band_members INSERT: block self-join as admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert members" ON public.band_members;

CREATE POLICY "Admins can insert members"
  ON public.band_members FOR INSERT
  WITH CHECK (public.is_band_admin(band_id));

-- ---------------------------------------------------------------------------
-- 2. Invitations: remove open SELECT, expose single-token RPC
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read invitation by token for accept flow"
  ON public.invitations;

CREATE POLICY "Admins read band invitations"
  ON public.invitations FOR SELECT
  USING (public.is_band_admin(band_id));

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', i.id,
    'token', i.token,
    'email', i.email,
    'role', i.role,
    'instrument', i.instrument,
    'band_name', b.name,
    'band_slug', b.slug
  )
  FROM public.invitations i
  JOIN public.bands b ON b.id = i.band_id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. create_band_with_admin: caller must match p_user_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_band_with_admin(
  p_name TEXT,
  p_user_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_instrument public.instrument DEFAULT 'guitar'
)
RETURNS UUID AS $$
DECLARE
  v_band_id UUID;
  v_slug TEXT;
  v_suffix INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_slug := public.slugify(p_name);

  WHILE EXISTS (SELECT 1 FROM public.bands WHERE slug = v_slug) LOOP
    v_suffix := v_suffix + 1;
    v_slug := public.slugify(p_name) || '-' || v_suffix;
  END LOOP;

  INSERT INTO public.bands (name, slug, created_by)
  VALUES (p_name, v_slug, p_user_id)
  RETURNING id INTO v_band_id;

  INSERT INTO public.band_members (band_id, user_id, role, instrument, display_name)
  VALUES (
    v_band_id,
    p_user_id,
    'admin',
    p_instrument,
    COALESCE(p_display_name, (SELECT display_name FROM public.profiles WHERE id = p_user_id))
  );

  RETURN v_band_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 4. accept_invitation: enforce invite email when set
-- ---------------------------------------------------------------------------
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

  INSERT INTO public.band_members (band_id, user_id, role, instrument, display_name)
  VALUES (
    v_inv.band_id,
    auth.uid(),
    v_inv.role,
    v_inv.instrument,
    (SELECT display_name FROM public.profiles WHERE id = auth.uid())
  )
  RETURNING id INTO v_member_id;

  UPDATE public.invitations
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_inv.id;

  RETURN v_inv.band_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 5. Public band page: hide rider fields when rider_public = false
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_band_page(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', CASE WHEN b.rider_public THEN b.description ELSE NULL END,
    'genre', CASE WHEN b.rider_public THEN b.genre ELSE NULL END,
    'rider_public', b.rider_public,
    'repertoire_public', COALESCE(b.repertoire_public, false),
    'tech_rider', CASE WHEN b.rider_public THEN b.tech_rider ELSE NULL END,
    'social_links', CASE
      WHEN b.rider_public THEN b.social_links
      ELSE '{}'::jsonb
    END,
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
