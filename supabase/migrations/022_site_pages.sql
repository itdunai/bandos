-- Публичные юридические страницы (политика конфиденциальности)

CREATE TABLE IF NOT EXISTS public.site_pages (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 200000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.site_pages FROM PUBLIC;
GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_pages TO authenticated;

CREATE POLICY "site_pages_public_select"
  ON public.site_pages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "site_pages_admin_insert"
  ON public.site_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "site_pages_admin_update"
  ON public.site_pages FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.touch_site_page()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS site_pages_touch ON public.site_pages;
CREATE TRIGGER site_pages_touch
  BEFORE INSERT OR UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_site_page();
