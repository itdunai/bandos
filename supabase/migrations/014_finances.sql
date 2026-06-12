-- BandOS: finances (opening balance + income/expense transactions)

ALTER TABLE public.bands
  ADD COLUMN IF NOT EXISTS finance_opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TYPE public.finance_transaction_type AS ENUM ('income', 'expense');

CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  transaction_type public.finance_transaction_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL,
  notes TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  transaction_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_transactions_band ON public.finance_transactions(band_id);
CREATE INDEX idx_finance_transactions_date ON public.finance_transactions(transaction_at DESC);
CREATE UNIQUE INDEX idx_finance_transactions_event_unique
  ON public.finance_transactions(event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read finance transactions"
  ON public.finance_transactions FOR SELECT
  USING (band_id IN (SELECT public.user_band_ids()));

CREATE POLICY "Admins insert finance transactions"
  ON public.finance_transactions FOR INSERT
  WITH CHECK (public.is_band_admin(band_id));

CREATE POLICY "Admins update finance transactions"
  ON public.finance_transactions FOR UPDATE
  USING (public.is_band_admin(band_id));

CREATE POLICY "Admins delete finance transactions"
  ON public.finance_transactions FOR DELETE
  USING (public.is_band_admin(band_id));

CREATE OR REPLACE FUNCTION public.set_finance_opening_balance(
  p_band_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_band_admin(p_band_id) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  UPDATE public.bands
  SET finance_opening_balance = p_amount
  WHERE id = p_band_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.set_finance_opening_balance(UUID, NUMERIC)
  TO authenticated;
