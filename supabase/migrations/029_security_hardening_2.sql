-- Аудит безопасности (октябрь 2026). Закрывает:
--   1. Открытое чтение таблицы bands анонимами (утечка finance_opening_balance, created_by).
--   2. Прямую вставку в bands в обход create_band_with_admin.
--   3. Правку привилегированных колонок bands участниками с правом «Профиль группы».
--   4. Запись произвольных событий в журнал платформы от чужого имени.
--   5. Неиспользуемые публичные RPC (get_public_repertoire отдавал черновики треков).
-- Все публичные страницы работают через get_public_band_page / get_public_bands_catalog.

-- ---------------------------------------------------------------------------
-- 1. bands: публичный SELECT не нужен — публичные данные отдают RPC
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view bands with public rider" ON public.bands;

-- ---------------------------------------------------------------------------
-- 2. bands: создание только через create_band_with_admin (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create bands" ON public.bands;

-- ---------------------------------------------------------------------------
-- 3. bands: slug, created_by — неизменяемы; стартовый баланс — только админ
--    (через set_finance_opening_balance). auth.uid() IS NULL — service role /
--    SQL Editor, им можно всё.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_bands_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Изменение slug/created_by группы запрещено'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.finance_opening_balance IS DISTINCT FROM OLD.finance_opening_balance
     AND NOT public.is_band_admin(OLD.id) THEN
    RAISE EXCEPTION 'Стартовый баланс может менять только администратор'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS bands_guard_privileged ON public.bands;
CREATE TRIGGER bands_guard_privileged
  BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.guard_bands_privileged_columns();

-- ---------------------------------------------------------------------------
-- 4. Журнал платформы: пользователь пишет только от своего имени
--    (сервер пишет через service role без ограничений), с лимитами размера.
-- ---------------------------------------------------------------------------
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
  v_is_service BOOLEAN := COALESCE(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_level NOT IN ('info', 'warn', 'error') THEN
    RAISE EXCEPTION 'invalid level';
  END IF;

  IF p_event IS NULL OR p_event !~ '^[a-z0-9_.]{1,64}$' THEN
    RAISE EXCEPTION 'invalid event';
  END IF;

  IF octet_length(COALESCE(p_meta, '{}'::jsonb)::text) > 4096 THEN
    RAISE EXCEPTION 'meta too large';
  END IF;

  IF NOT v_is_service THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
    END IF;
    IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'user_id mismatch' USING ERRCODE = '42501';
    END IF;
    IF p_band_id IS NOT NULL
       AND p_band_id NOT IN (SELECT public.user_band_ids()) THEN
      p_band_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.platform_audit_log (level, event, user_id, band_id, meta)
  VALUES (p_level, p_event, p_user_id, p_band_id, COALESCE(p_meta, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.log_platform_event(TEXT, TEXT, UUID, UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_platform_event(TEXT, TEXT, UUID, UUID, JSONB)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Неиспользуемые публичные RPC
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_public_band(TEXT);
DROP FUNCTION IF EXISTS public.get_public_repertoire(TEXT);
