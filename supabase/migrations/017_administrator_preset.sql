-- Пресет «administrator» — полные права группы (кроме роли создателя band role=admin)

CREATE OR REPLACE FUNCTION public.is_band_admin(p_band_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = p_band_id
      AND user_id = auth.uid()
      AND is_active = true
      AND (
        role = 'admin'
        OR permission_preset = 'administrator'
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.member_has_permission(
  p_band_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.band_members bm
    WHERE bm.band_id = p_band_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = true
      AND (
        bm.role = 'admin'
        OR bm.permission_preset = 'administrator'
        OR COALESCE((bm.permissions ->> p_permission)::boolean, false) = true
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
