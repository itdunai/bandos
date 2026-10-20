-- Защита от эскалации привилегий через UPDATE «своей строки».
-- Политики "Users can update own profile" (profiles) и "Members update own profile"
-- (band_members) не ограничены по колонкам, поэтому привилегированные поля
-- охраняются триггерами. auth.uid() IS NULL — service role / SQL Editor, им можно всё.

-- ---------------------------------------------------------------------------
-- 1. profiles.is_platform_admin — только service role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin THEN
    RAISE EXCEPTION 'Изменение is_platform_admin запрещено'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Изменение id профиля запрещено'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_guard_privileged ON public.profiles;
CREATE TRIGGER profiles_guard_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged_columns();

-- ---------------------------------------------------------------------------
-- 2. band_members: роль, права, активность — только админ группы
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_band_members_privileged_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.band_id IS DISTINCT FROM OLD.band_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Изменение band_id/user_id участника запрещено'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.permissions IS DISTINCT FROM OLD.permissions
     OR NEW.permission_preset IS DISTINCT FROM OLD.permission_preset
     OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN

    IF NOT public.is_band_admin(OLD.band_id) THEN
      RAISE EXCEPTION 'Недостаточно прав для изменения роли или прав участника'
        USING ERRCODE = '42501';
    END IF;

    -- Создатель группы (role = admin) неизменяем, и назначить нового нельзя
    IF OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Права создателя группы нельзя изменить'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Назначить роль создателя группы нельзя'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS band_members_guard_privileged ON public.band_members;
CREATE TRIGGER band_members_guard_privileged
  BEFORE UPDATE ON public.band_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_band_members_privileged_columns();
