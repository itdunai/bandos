-- Расширение списка дел: описание и заметки (due_date уже есть)
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
