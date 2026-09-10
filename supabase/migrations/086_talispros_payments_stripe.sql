-- MapSite™ activation: Stripe identifiers alongside historical PayPal columns.
-- Existing PayPal rows stay valid; new activation payments record Stripe ids.

ALTER TABLE talispros_payments
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

UPDATE talispros_payments
SET payment_provider = 'paypal'
WHERE payment_provider IS NULL
  AND (paypal_order_id IS NOT NULL OR paypal_capture_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS talispros_payments_stripe_checkout_session_id_uidx
  ON talispros_payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
