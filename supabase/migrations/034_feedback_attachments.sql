-- 034: скриншоты в обращениях (PNG/JPG, до 3 штук)
--   Закрытый bucket feedback-attachments: файл лежит в папке автора
--   ({user_id}/...), видят автор и админы платформы (по временной ссылке).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "feedback_attachments_insert_own" ON storage.objects;
CREATE POLICY "feedback_attachments_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "feedback_attachments_read" ON storage.objects;
CREATE POLICY "feedback_attachments_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'feedback-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_platform_admin()
    )
  );

DROP POLICY IF EXISTS "feedback_attachments_delete_own" ON storage.objects;
CREATE POLICY "feedback_attachments_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'feedback-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS attachments TEXT[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(attachments) <= 3);

-- submit_feedback с вложениями: пути только из папки автора
DROP FUNCTION IF EXISTS public.submit_feedback(TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_kind TEXT,
  p_message TEXT,
  p_page TEXT DEFAULT NULL,
  p_band_id UUID DEFAULT NULL,
  p_attachments TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
  v_message TEXT := trim(COALESCE(p_message, ''));
  v_attachments TEXT[] := COALESCE(p_attachments, '{}');
  v_path TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF v_message = '' THEN
    RAISE EXCEPTION 'Напишите сообщение' USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_attachments) > 3 THEN
    RAISE EXCEPTION 'Не больше трёх вложений' USING ERRCODE = '22023';
  END IF;

  FOREACH v_path IN ARRAY v_attachments LOOP
    IF v_path NOT LIKE v_uid::text || '/%' OR char_length(v_path) > 200 OR v_path LIKE '%..%' THEN
      RAISE EXCEPTION 'Недопустимое вложение' USING ERRCODE = '22023';
    END IF;
  END LOOP;

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

  INSERT INTO public.feedback (user_id, email, band_id, kind, message, page, attachments)
  VALUES (
    v_uid,
    (SELECT email FROM auth.users WHERE id = v_uid),
    p_band_id,
    CASE WHEN p_kind IN ('bug', 'idea', 'question') THEN p_kind ELSE 'other' END,
    left(v_message, 4000),
    left(NULLIF(trim(COALESCE(p_page, '')), ''), 500),
    v_attachments
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.submit_feedback(TEXT, TEXT, TEXT, UUID, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_feedback(TEXT, TEXT, TEXT, UUID, TEXT[]) TO authenticated;
