-- Подготовка к открытой бете:
--   1. delete_my_account — пользователь удаляет свой аккаунт сам (152-ФЗ / GDPR).
--   2. feedback — обратная связь из приложения (видит только админ платформы).

-- ---------------------------------------------------------------------------
-- 1. Удаление аккаунта
--    Группы, где пользователь — создатель (role = 'admin'), удаляются целиком:
--    роль создателя передать нельзя (027), группа без него осталась бы без
--    управления. Из остальных групп пользователь просто выходит (каскад
--    profiles → band_members). Файлы в Storage приложение удаляет до вызова.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_my_account(p_confirm_email TEXT)
RETURNS VOID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL
     OR lower(trim(COALESCE(p_confirm_email, ''))) <> lower(v_email) THEN
    RAISE EXCEPTION 'Email не совпадает с email аккаунта' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.bands
  WHERE id IN (
    SELECT band_id FROM public.band_members
    WHERE user_id = v_uid AND role = 'admin'
  );

  -- Каскад: profiles, band_members, telegram_accounts, сессии и identities
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.delete_my_account(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Обратная связь
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT,
  band_id UUID REFERENCES public.bands(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bug', 'idea', 'question', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  page TEXT CHECK (page IS NULL OR char_length(page) <= 500),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.feedback(user_id, created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Вставка только через submit_feedback (лимит и привязка к auth.uid())
DROP POLICY IF EXISTS "Platform admin reads feedback" ON public.feedback;
CREATE POLICY "Platform admin reads feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin updates feedback" ON public.feedback;
CREATE POLICY "Platform admin updates feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_kind TEXT,
  p_message TEXT,
  p_page TEXT DEFAULT NULL,
  p_band_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_message TEXT := trim(COALESCE(p_message, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF v_message = '' THEN
    RAISE EXCEPTION 'Напишите сообщение' USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(*) FROM public.feedback
    WHERE user_id = v_uid AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Слишком много сообщений — попробуйте через час'
      USING ERRCODE = '54000';
  END IF;

  IF p_band_id IS NOT NULL
     AND p_band_id NOT IN (SELECT public.user_band_ids()) THEN
    p_band_id := NULL;
  END IF;

  INSERT INTO public.feedback (user_id, email, band_id, kind, message, page)
  VALUES (
    v_uid,
    (SELECT email FROM auth.users WHERE id = v_uid),
    p_band_id,
    CASE WHEN p_kind IN ('bug', 'idea', 'question') THEN p_kind ELSE 'other' END,
    left(v_message, 4000),
    left(NULLIF(trim(COALESCE(p_page, '')), ''), 500)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.submit_feedback(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_feedback(TEXT, TEXT, TEXT, UUID) TO authenticated;
