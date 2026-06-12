-- Ссылка на источник трека (демо, YouTube, облако и т.д.)
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS source_url TEXT;
