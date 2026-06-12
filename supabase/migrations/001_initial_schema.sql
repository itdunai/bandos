-- BandOS: core schema (multi-tenant)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Bands
-- ---------------------------------------------------------------------------
CREATE TABLE public.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bands_slug ON public.bands(slug);

-- ---------------------------------------------------------------------------
-- Band members
-- ---------------------------------------------------------------------------
CREATE TYPE public.member_role AS ENUM ('admin', 'member', 'manager', 'session');
CREATE TYPE public.instrument AS ENUM (
  'guitar', 'bass', 'drums', 'vocals', 'keys', 'other'
);

CREATE TABLE public.band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  instrument public.instrument DEFAULT 'other',
  display_name TEXT,
  phone TEXT,
  telegram TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (band_id, user_id)
);

CREATE INDEX idx_band_members_user ON public.band_members(user_id);
CREATE INDEX idx_band_members_band ON public.band_members(band_id);

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  email TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  role public.member_role NOT NULL DEFAULT 'member',
  instrument public.instrument DEFAULT 'other',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_token ON public.invitations(token);

-- ---------------------------------------------------------------------------
-- Songs
-- ---------------------------------------------------------------------------
CREATE TYPE public.song_status AS ENUM ('ready', 'in_progress', 'demo', 'frozen');
CREATE TYPE public.song_type AS ENUM ('original', 'cover');

CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status public.song_status NOT NULL DEFAULT 'in_progress',
  bpm INTEGER,
  key TEXT,
  duration_sec INTEGER,
  song_type public.song_type NOT NULL DEFAULT 'original',
  genre TEXT,
  structure TEXT,
  last_rehearsed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_songs_band ON public.songs(band_id);

-- ---------------------------------------------------------------------------
-- Song contents (chords, tabs, lyrics — per instrument)
-- ---------------------------------------------------------------------------
CREATE TYPE public.content_type AS ENUM (
  'chords', 'tabs', 'lyrics', 'notes', 'structure'
);

CREATE TABLE public.song_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  content_type public.content_type NOT NULL,
  instrument public.instrument,
  body TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (song_id, content_type, instrument)
);

CREATE INDEX idx_song_contents_song ON public.song_contents(song_id);

-- ---------------------------------------------------------------------------
-- Song members (who plays what)
-- ---------------------------------------------------------------------------
CREATE TABLE public.song_members (
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.band_members(id) ON DELETE CASCADE,
  part TEXT,
  PRIMARY KEY (song_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Setlists
-- ---------------------------------------------------------------------------
CREATE TABLE public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_setlists_band ON public.setlists(band_id);

CREATE TABLE public.setlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  title TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  duration_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_setlist_items_setlist ON public.setlist_items(setlist_id);

-- ---------------------------------------------------------------------------
-- Events (rehearsals + performances)
-- ---------------------------------------------------------------------------
CREATE TYPE public.event_type AS ENUM ('rehearsal', 'performance');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  setlist_id UUID REFERENCES public.setlists(id) ON DELETE SET NULL,
  organizer TEXT,
  fee NUMERIC(12, 2),
  rider JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_band ON public.events(band_id);
CREATE INDEX idx_events_starts ON public.events(starts_at);

CREATE TYPE public.attendance_status AS ENUM ('going', 'maybe', 'absent');

CREATE TABLE public.event_attendance (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.band_members(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'going',
  PRIMARY KEY (event_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Todos (simple done / not done)
-- ---------------------------------------------------------------------------
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  assignee_id UUID REFERENCES public.band_members(id) ON DELETE SET NULL,
  due_date DATE,
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_todos_band ON public.todos(band_id);

-- ---------------------------------------------------------------------------
-- Helpers: updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bands_updated_at
  BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER band_members_updated_at
  BEFORE UPDATE ON public.band_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER setlists_updated_at
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user → profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Slug helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(trim(value), '[^a-zA-Z0-9а-яА-ЯёЁ\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- Create band (on registration)
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
-- Accept invitation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
  v_member_id UUID;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
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
