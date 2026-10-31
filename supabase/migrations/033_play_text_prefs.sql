-- 033: настройки текста в режиме «Играем» (размер, выравнивание, шрифт) —
-- у каждого пользователя свои и одинаковые на всех его устройствах.
-- Пишет сам пользователь (политика «Users can update own profile»);
-- в браузере дублируются для офлайна.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS play_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
