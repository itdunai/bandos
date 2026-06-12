-- Размер такта для треков (метроном в режиме «Играем»)

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS time_signature TEXT NOT NULL DEFAULT '4/4';
