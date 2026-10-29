-- 031: обращения как тикеты (статус, ответ, «новое» для автора) и метрика платформы
--   1. feedback: статусы new / in_progress / done / declined, ответ админа,
--      отметка «прочитано» для автора; автор видит свои обращения.
--   2. user_activity_days: дни, когда пользователь заходил (DAU/WAU/MAU, удержание).
--   3. get_platform_metrics(): графики, воронка, удержание, топ групп — для /admin.

-- ---------------------------------------------------------------------------
-- 1. Тикеты обратной связи
-- ---------------------------------------------------------------------------
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('new', 'in_progress', 'done', 'declined'));

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS admin_reply TEXT
    CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 4000),
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  -- Когда админ последний раз менял статус/ответ
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Когда автор последний раз смотрел свои обращения
  ADD COLUMN IF NOT EXISTS user_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status, created_at DESC);

DROP POLICY IF EXISTS "Users read own feedback" ON public.feedback;
CREATE POLICY "Users read own feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Автор не может менять строки напрямую (UPDATE только у админа) —
-- отметка «прочитано» через функцию.
CREATE OR REPLACE FUNCTION public.mark_my_feedback_seen()
RETURNS VOID AS $$
  UPDATE public.feedback
  SET user_seen_at = now()
  WHERE user_id = auth.uid() AND updated_at > user_seen_at;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.my_unread_feedback_count()
RETURNS INT AS $$
  SELECT count(*)::int FROM public.feedback
  WHERE user_id = auth.uid() AND updated_at > user_seen_at;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.mark_my_feedback_seen() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_unread_feedback_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_my_feedback_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_unread_feedback_count() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Активность пользователей (одна строка на пользователя в день, UTC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_activity_days (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_day ON public.user_activity_days(day);

ALTER TABLE public.user_activity_days ENABLE ROW LEVEL SECURITY;
-- Политик нет: читает только get_platform_metrics, пишет только touch_activity

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.touch_activity()
RETURNS VOID AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_activity_days (user_id, day)
  VALUES (v_uid, (now() AT TIME ZONE 'utc')::date)
  ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET last_seen_at = now() WHERE id = v_uid;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.touch_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_activity() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Метрика для /admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_metrics(p_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  v_days INT := LEAST(GREATEST(COALESCE(p_days, 30), 7), 180);
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  v_from DATE := v_today - (v_days - 1);
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN json_build_object(
    'days', v_days,
    'series', (
      SELECT json_agg(json_build_object(
        'day', d::date,
        'registrations', (SELECT count(*) FROM public.profiles p
                          WHERE (p.created_at AT TIME ZONE 'utc')::date = d::date),
        'bands', (SELECT count(*) FROM public.bands b
                  WHERE (b.created_at AT TIME ZONE 'utc')::date = d::date),
        'active', (SELECT count(*) FROM public.user_activity_days a WHERE a.day = d::date),
        'songs', (SELECT count(*) FROM public.songs s
                  WHERE (s.created_at AT TIME ZONE 'utc')::date = d::date
                    AND s.title NOT LIKE '%(пример)'),
        'events', (SELECT count(*) FROM public.events e
                   WHERE (e.created_at AT TIME ZONE 'utc')::date = d::date)
      ) ORDER BY d)
      FROM generate_series(v_from, v_today, interval '1 day') AS d
    ),
    'active', json_build_object(
      'dau', (SELECT count(*) FROM public.user_activity_days WHERE day = v_today),
      'wau', (SELECT count(DISTINCT user_id) FROM public.user_activity_days
              WHERE day > v_today - 7),
      'mau', (SELECT count(DISTINCT user_id) FROM public.user_activity_days
              WHERE day > v_today - 30),
      'tracking_since', (SELECT min(day) FROM public.user_activity_days)
    ),
    'funnel', json_build_object(
      'registered', (SELECT count(*) FROM public.profiles),
      'in_band', (SELECT count(DISTINCT user_id) FROM public.band_members WHERE is_active),
      'band_with_team', (
        SELECT count(DISTINCT bm.user_id) FROM public.band_members bm
        WHERE bm.is_active AND bm.band_id IN (
          SELECT band_id FROM public.band_members WHERE is_active
          GROUP BY band_id HAVING count(*) >= 2
        )
      ),
      'band_with_own_songs', (
        SELECT count(DISTINCT bm.user_id) FROM public.band_members bm
        WHERE bm.is_active AND bm.band_id IN (
          SELECT band_id FROM public.songs WHERE title NOT LIKE '%(пример)'
        )
      ),
      'telegram', (SELECT count(*) FROM public.telegram_accounts)
    ),
    -- Вернулись через неделю: из зарегистрированных 7–60 дней назад —
    -- сколько заходили на 7-й день после регистрации и позже
    'retention', (
      SELECT json_build_object(
        'cohort', count(*),
        'returned', count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM public.user_activity_days a
          WHERE a.user_id = p.id
            AND a.day >= (p.created_at AT TIME ZONE 'utc')::date + 7
        ))
      )
      FROM public.profiles p
      WHERE p.created_at < now() - interval '7 days'
        AND p.created_at >= now() - interval '60 days'
    ),
    'top_bands', (
      SELECT COALESCE(json_agg(t ORDER BY t.last_activity DESC NULLS LAST), '[]'::json)
      FROM (
        SELECT
          b.name,
          b.slug,
          b.created_at,
          (SELECT count(*) FROM public.band_members m WHERE m.band_id = b.id AND m.is_active) AS members,
          (SELECT count(*) FROM public.songs s WHERE s.band_id = b.id AND s.title NOT LIKE '%(пример)') AS songs,
          (SELECT count(*) FROM public.setlists sl WHERE sl.band_id = b.id) AS setlists,
          (SELECT count(*) FROM public.events e WHERE e.band_id = b.id) AS events,
          (SELECT max(a.day) FROM public.user_activity_days a
             JOIN public.band_members m ON m.user_id = a.user_id
            WHERE m.band_id = b.id AND m.is_active) AS last_activity
        FROM public.bands b
        ORDER BY last_activity DESC NULLS LAST, b.created_at DESC
        LIMIT 15
      ) t
    ),
    'feedback', json_build_object(
      'open', (SELECT count(*) FROM public.feedback WHERE status IN ('new', 'in_progress')),
      'new', (SELECT count(*) FROM public.feedback WHERE status = 'new')
    ),
    'errors_7d', (SELECT count(*) FROM public.platform_audit_log
                  WHERE level = 'error' AND created_at > now() - interval '7 days')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_platform_metrics(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_metrics(INT) TO authenticated;
