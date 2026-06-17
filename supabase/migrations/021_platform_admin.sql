-- Платформенная админка: флаг владельца и журнал событий

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  event TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  band_id UUID REFERENCES public.bands(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created
  ON public.platform_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_log_level
  ON public.platform_audit_log (level);

ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (
      SELECT p.is_platform_admin
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_platform_event(
  p_level TEXT,
  p_event TEXT,
  p_user_id UUID DEFAULT NULL,
  p_band_id UUID DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_level NOT IN ('info', 'warn', 'error') THEN
    RAISE EXCEPTION 'invalid level';
  END IF;

  INSERT INTO public.platform_audit_log (level, event, user_id, band_id, meta)
  VALUES (p_level, p_event, p_user_id, p_band_id, COALESCE(p_meta, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN json_build_object(
    'users', (SELECT count(*)::int FROM public.profiles),
    'bands', (SELECT count(*)::int FROM public.bands),
    'active_members', (
      SELECT count(*)::int FROM public.band_members WHERE is_active = true
    ),
    'songs', (SELECT count(*)::int FROM public.songs),
    'setlists', (SELECT count(*)::int FROM public.setlists),
    'public_bands', (
      SELECT count(*)::int FROM public.bands
      WHERE rider_public = true OR COALESCE(repertoire_public, false) = true
    ),
    'registrations_7d', (
      SELECT count(*)::int FROM public.profiles
      WHERE created_at >= now() - interval '7 days'
    ),
    'bands_7d', (
      SELECT count(*)::int FROM public.bands
      WHERE created_at >= now() - interval '7 days'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "platform_audit_log_admin_select"
  ON public.platform_audit_log FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- Запись только через RPC log_platform_event

GRANT EXECUTE ON FUNCTION public.log_platform_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin TO authenticated;
