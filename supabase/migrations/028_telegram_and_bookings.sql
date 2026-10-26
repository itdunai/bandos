-- Telegram-уведомления и заявки «Заказать группу».
--
-- Таблицы Telegram пишет только сервер (service role): webhook бота и рассылка
-- напоминаний. Пользователь читает/удаляет свою привязку и меняет настройки
-- через RPC — chat_id напрямую не редактируется (иначе можно направить чужие
-- уведомления в произвольный чат).

-- ---------------------------------------------------------------------------
-- 1. Привязка Telegram к пользователю
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notify_events BOOLEAN NOT NULL DEFAULT true,
  notify_todos BOOLEAN NOT NULL DEFAULT true,
  notify_bookings BOOLEAN NOT NULL DEFAULT true,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own telegram account" ON public.telegram_accounts;
CREATE POLICY "Users read own telegram account"
  ON public.telegram_accounts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users unlink own telegram account" ON public.telegram_accounts;
CREATE POLICY "Users unlink own telegram account"
  ON public.telegram_accounts FOR DELETE
  USING (user_id = auth.uid());

-- Одноразовые токены для ссылки t.me/<bot>?start=<token>
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_link_tokens ENABLE ROW LEVEL SECURITY;
-- Политик нет: доступ только у service role.

CREATE OR REPLACE FUNCTION public.create_telegram_link_token(p_timezone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_user UUID := auth.uid();
  v_token TEXT;
  v_tz TEXT := COALESCE(NULLIF(trim(p_timezone), ''), 'UTC');
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Требуется вход' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_tz) > 64 OR v_tz !~ '^[A-Za-z0-9_+/-]+$' THEN
    v_tz := 'UTC';
  END IF;

  DELETE FROM public.telegram_link_tokens
  WHERE user_id = v_user OR expires_at < now();

  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');
  v_token := left(v_token, 48);

  INSERT INTO public.telegram_link_tokens (token, user_id, timezone, expires_at)
  VALUES (v_token, v_user, v_tz, now() + interval '15 minutes');

  RETURN v_token;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_telegram_link_token(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_telegram_settings(
  p_notify_events BOOLEAN,
  p_notify_todos BOOLEAN,
  p_notify_bookings BOOLEAN,
  p_timezone TEXT
)
RETURNS VOID AS $$
DECLARE
  v_tz TEXT := NULLIF(trim(p_timezone), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Требуется вход' USING ERRCODE = '42501';
  END IF;

  IF v_tz IS NOT NULL AND (char_length(v_tz) > 64 OR v_tz !~ '^[A-Za-z0-9_+/-]+$') THEN
    v_tz := NULL;
  END IF;

  UPDATE public.telegram_accounts
  SET notify_events = COALESCE(p_notify_events, notify_events),
      notify_todos = COALESCE(p_notify_todos, notify_todos),
      notify_bookings = COALESCE(p_notify_bookings, notify_bookings),
      timezone = COALESCE(v_tz, timezone)
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_telegram_settings(BOOLEAN, BOOLEAN, BOOLEAN, TEXT)
  TO authenticated;

-- Журнал отправленных уведомлений: не шлём одно и то же дважды
CREATE TABLE IF NOT EXISTS public.notification_log (
  kind TEXT NOT NULL,
  ref_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, ref_id, user_id)
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
-- Политик нет: доступ только у service role.

-- ---------------------------------------------------------------------------
-- 2. Заявки «Заказать группу»
-- ---------------------------------------------------------------------------
ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS accept_bookings BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('new', 'in_progress', 'agreed', 'declined');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  contact TEXT NOT NULL CHECK (char_length(contact) BETWEEN 3 AND 200),
  event_date DATE,
  city TEXT CHECK (char_length(city) <= 100),
  event_format TEXT CHECK (char_length(event_format) <= 100),
  message TEXT CHECK (char_length(message) <= 2000),
  status public.booking_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_band
  ON public.booking_requests(band_id, created_at DESC);

DROP TRIGGER IF EXISTS booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Заявки содержат контакты заказчиков: только админы и участники с правом
-- «Профиль группы». Вставка — только через submit_booking_request().
DROP POLICY IF EXISTS "Managers read bookings" ON public.booking_requests;
CREATE POLICY "Managers read bookings"
  ON public.booking_requests FOR SELECT
  USING (public.member_has_permission(band_id, 'band_profile'));

DROP POLICY IF EXISTS "Managers update bookings" ON public.booking_requests;
CREATE POLICY "Managers update bookings"
  ON public.booking_requests FOR UPDATE
  USING (public.member_has_permission(band_id, 'band_profile'))
  WITH CHECK (public.member_has_permission(band_id, 'band_profile'));

DROP POLICY IF EXISTS "Managers delete bookings" ON public.booking_requests;
CREATE POLICY "Managers delete bookings"
  ON public.booking_requests FOR DELETE
  USING (public.member_has_permission(band_id, 'band_profile'));

CREATE OR REPLACE FUNCTION public.submit_booking_request(
  p_slug TEXT,
  p_name TEXT,
  p_contact TEXT,
  p_event_date DATE,
  p_city TEXT,
  p_format TEXT,
  p_message TEXT
)
RETURNS UUID AS $$
DECLARE
  v_band_id UUID;
  v_name TEXT := NULLIF(trim(p_name), '');
  v_contact TEXT := NULLIF(trim(p_contact), '');
  v_city TEXT := NULLIF(trim(p_city), '');
  v_format TEXT := NULLIF(trim(p_format), '');
  v_message TEXT := NULLIF(trim(p_message), '');
  v_id UUID;
BEGIN
  SELECT b.id INTO v_band_id
  FROM public.bands b
  WHERE b.slug = p_slug
    AND b.accept_bookings = true
    AND (b.rider_public = true OR COALESCE(b.repertoire_public, false) = true);

  IF v_band_id IS NULL THEN
    RAISE EXCEPTION 'Группа не принимает заявки' USING ERRCODE = 'P0001';
  END IF;

  IF v_name IS NULL OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'Укажите имя (до 100 символов)' USING ERRCODE = 'P0001';
  END IF;
  IF v_contact IS NULL OR char_length(v_contact) < 3 OR char_length(v_contact) > 200 THEN
    RAISE EXCEPTION 'Укажите телефон, e-mail или Telegram' USING ERRCODE = 'P0001';
  END IF;
  IF char_length(v_city) > 100 OR char_length(v_format) > 100 OR char_length(v_message) > 2000 THEN
    RAISE EXCEPTION 'Слишком длинный текст' USING ERRCODE = 'P0001';
  END IF;
  IF p_event_date IS NOT NULL
     AND (p_event_date < current_date - 1 OR p_event_date > current_date + 1095) THEN
    RAISE EXCEPTION 'Проверьте дату мероприятия' USING ERRCODE = 'P0001';
  END IF;

  -- Защита от спама: не больше 10 заявок в час на группу и одна в 10 минут с одного контакта
  IF (SELECT count(*) FROM public.booking_requests
      WHERE band_id = v_band_id AND created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'Слишком много заявок, попробуйте позже' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.booking_requests
             WHERE band_id = v_band_id
               AND lower(contact) = lower(v_contact)
               AND created_at > now() - interval '10 minutes') THEN
    RAISE EXCEPTION 'Заявка уже отправлена, группа скоро свяжется с вами' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.booking_requests (band_id, name, contact, event_date, city, event_format, message)
  VALUES (v_band_id, v_name, v_contact, p_event_date, v_city, v_format, v_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_booking_request(TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Публичная страница: флаг accept_bookings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_band_page(p_slug TEXT)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', b.name,
    'slug', b.slug,
    'description', b.description,
    'genre', b.genre,
    'city', b.city,
    'logo_url', b.logo_url,
    'photos', COALESCE(b.photos, '[]'::jsonb),
    'rider_public', b.rider_public,
    'repertoire_public', COALESCE(b.repertoire_public, false),
    'accept_bookings', b.accept_bookings,
    'tech_rider', b.tech_rider,
    'social_links', b.social_links,
    'contacts', COALESCE(b.contacts, '[]'::jsonb),
    'tracks_count', (
      SELECT count(*)::int FROM public.songs s
      WHERE s.band_id = b.id AND s.status = 'ready'
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
        WHERE s.band_id = b.id AND s.status = 'ready'
      ), '[]'::json)
      ELSE '[]'::json
    END,
    'releases', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', r.id,
          'title', r.title,
          'released_at', r.released_at,
          'cover_url', r.cover_url,
          'links', COALESCE((
            SELECT json_agg(
              json_build_object(
                'platform', rl.platform,
                'url', rl.url
              )
              ORDER BY rl.platform
            )
            FROM public.release_links rl
            WHERE rl.release_id = r.id
          ), '[]'::json)
        )
        ORDER BY r.released_at DESC
      )
      FROM (
        SELECT *
        FROM public.releases rel
        WHERE rel.band_id = b.id
        ORDER BY rel.released_at DESC
        LIMIT 6
      ) r
    ), '[]'::json)
  )
  FROM public.bands b
  WHERE b.slug = p_slug
    AND (b.rider_public = true OR COALESCE(b.repertoire_public, false) = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
