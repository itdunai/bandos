-- Finances: view permission for presets + RLS read gate

UPDATE public.band_members
SET permissions = permissions || '{"finances": true}'::jsonb
WHERE permission_preset = 'manager'
  AND NOT COALESCE((permissions ->> 'finances')::boolean, false);

DROP POLICY IF EXISTS "Members read finance transactions" ON public.finance_transactions;

CREATE POLICY "Members read finance transactions"
  ON public.finance_transactions FOR SELECT
  USING (public.member_has_permission(band_id, 'finances'));
