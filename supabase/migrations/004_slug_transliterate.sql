-- Транслитерация кириллицы в slug (только a-z0-9-)

CREATE OR REPLACE FUNCTION public.transliterate(value TEXT)
RETURNS TEXT AS $$
BEGIN
  value := lower(value);
  value := replace(value, 'а', 'a'); value := replace(value, 'б', 'b');
  value := replace(value, 'в', 'v'); value := replace(value, 'г', 'g');
  value := replace(value, 'д', 'd'); value := replace(value, 'е', 'e');
  value := replace(value, 'ё', 'yo'); value := replace(value, 'ж', 'zh');
  value := replace(value, 'з', 'z'); value := replace(value, 'и', 'i');
  value := replace(value, 'й', 'y'); value := replace(value, 'к', 'k');
  value := replace(value, 'л', 'l'); value := replace(value, 'м', 'm');
  value := replace(value, 'н', 'n'); value := replace(value, 'о', 'o');
  value := replace(value, 'п', 'p'); value := replace(value, 'р', 'r');
  value := replace(value, 'с', 's'); value := replace(value, 'т', 't');
  value := replace(value, 'у', 'u'); value := replace(value, 'ф', 'f');
  value := replace(value, 'х', 'h'); value := replace(value, 'ц', 'ts');
  value := replace(value, 'ч', 'ch'); value := replace(value, 'ш', 'sh');
  value := replace(value, 'щ', 'sch'); value := replace(value, 'ъ', '');
  value := replace(value, 'ы', 'y'); value := replace(value, 'ь', '');
  value := replace(value, 'э', 'e'); value := replace(value, 'ю', 'yu');
  value := replace(value, 'я', 'ya');
  RETURN value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(trim(public.transliterate(value)), '[^a-z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Исправить существующие группы с кириллическим slug
DO $$
DECLARE
  r RECORD;
  v_new_slug TEXT;
  v_suffix INTEGER;
BEGIN
  FOR r IN SELECT id, name, slug FROM public.bands LOOP
    v_new_slug := public.slugify(r.name);
    IF v_new_slug = '' THEN
      v_new_slug := 'band';
    END IF;

    IF v_new_slug <> r.slug THEN
      v_suffix := 0;
      WHILE EXISTS (
        SELECT 1 FROM public.bands
        WHERE slug = v_new_slug AND id <> r.id
      ) LOOP
        v_suffix := v_suffix + 1;
        v_new_slug := public.slugify(r.name) || '-' || v_suffix;
      END LOOP;

      UPDATE public.bands SET slug = v_new_slug WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
