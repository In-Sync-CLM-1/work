-- ============================================================================
-- 036_razorpay_checkout.sql
-- Self-serve Razorpay checkout for plan upgrades.
--   * Extend payments with Razorpay order/payment refs, a status lifecycle,
--     and the GST / cycle / seat breakdown captured at charge time.
--   * Allow 'razorpay' as a payment method.
--   * Let org members read their OWN org's paid history (previously only the
--     platform admin could read payments, so the org Billing page always
--     showed an empty history).
-- The create-order / verify edge functions write with the service role and
-- bypass RLS; this policy is read-only for org members.
-- ============================================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS status              TEXT          NOT NULL DEFAULT 'paid'
                             CHECK (status IN ('created', 'paid', 'failed')),
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS base_amount         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_amount          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cycle               TEXT          CHECK (cycle IN ('monthly', 'quarterly', 'yearly')),
  ADD COLUMN IF NOT EXISTS seats               INTEGER;

-- Allow the Razorpay method alongside the existing manual methods.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_method_check
  CHECK (method IN ('upi', 'bank_transfer', 'card', 'cash', 'manual', 'razorpay'));

-- One DB row per Razorpay order — guards against double-finalisation
-- (the verify call and the webhook can both fire for the same order).
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_order_id_key
  ON public.payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Org members may read their own organisation's payment history.
DROP POLICY IF EXISTS "payments_org_read" ON public.payments;
CREATE POLICY "payments_org_read"
  ON public.payments FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT ur.org_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.is_active = true
    )
  );
