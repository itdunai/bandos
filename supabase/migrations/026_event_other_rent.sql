-- Тип «Другое» и аренда репетиции для учёта в финансах
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'other';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rent NUMERIC(12, 2);
