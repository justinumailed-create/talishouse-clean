-- Free additional-PIN allowance per Mapsite™ / FAST Code™.
-- Admin grants N free PIN credits; the owner's "Buy PINs" checkout uses them
-- before Stripe. Any remainder is charged at $7 CAD per PIN (CAD only).
--
-- Also realigns grant_mapsite_additional_pins with the live price
-- ($7 CAD = 700 cents, currency 'cad'). Migration 092 still enforced $10 USD,
-- so paid $7 CAD sessions could not be fulfilled.

ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS free_pin_credits integer NOT NULL DEFAULT 0;

ALTER TABLE mapsites
  DROP CONSTRAINT IF EXISTS mapsites_free_pin_credits_range;
ALTER TABLE mapsites
  ADD CONSTRAINT mapsites_free_pin_credits_range
  CHECK (free_pin_credits >= 0 AND free_pin_credits <= 99);

-- Free redemptions are recorded as completed purchases with no Stripe session.
ALTER TABLE mapsite_pin_purchases
  ADD COLUMN IF NOT EXISTS free_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE mapsite_pin_purchases
  DROP CONSTRAINT IF EXISTS mapsite_pin_purchases_free_quantity_range;
ALTER TABLE mapsite_pin_purchases
  ADD CONSTRAINT mapsite_pin_purchases_free_quantity_range
  CHECK (free_quantity >= 0 AND free_quantity <= quantity);
ALTER TABLE mapsite_pin_purchases
  ALTER COLUMN stripe_checkout_session_id DROP NOT NULL;
ALTER TABLE mapsite_pin_purchases
  ALTER COLUMN currency SET DEFAULT 'cad';

-- Audit: every admin grant / revoke of free PIN credits.
CREATE TABLE IF NOT EXISTS mapsite_free_pin_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapsite_id uuid NOT NULL REFERENCES mapsites(id) ON DELETE CASCADE,
  fast_code text NOT NULL,
  delta integer NOT NULL CHECK (delta <> 0 AND delta >= -99 AND delta <= 99),
  balance_after integer NOT NULL CHECK (balance_after >= 0 AND balance_after <= 99),
  granted_by text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mapsite_free_pin_grants_mapsite
  ON mapsite_free_pin_grants (mapsite_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mapsite_free_pin_grants_created
  ON mapsite_free_pin_grants (created_at DESC);

ALTER TABLE mapsite_free_pin_grants ENABLE ROW LEVEL SECURITY;

-- Admin grant (positive) or revoke (negative). Balance stays within 0..99.
CREATE OR REPLACE FUNCTION admin_grant_mapsite_free_pins(
  p_mapsite_id uuid,
  p_delta integer,
  p_granted_by text,
  p_note text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_fast_code text;
  v_credits integer;
  v_next integer;
  v_applied integer;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 OR p_delta < -99 OR p_delta > 99 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Choose between 1 and 99 free PINs.');
  END IF;
  IF p_granted_by IS NULL OR length(trim(p_granted_by)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing admin identity.');
  END IF;

  SELECT fast_code, COALESCE(free_pin_credits, 0) INTO v_fast_code, v_credits
  FROM mapsites
  WHERE id = p_mapsite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Mapsite™ was not found.');
  END IF;

  v_next := GREATEST(0, LEAST(99, v_credits + p_delta));
  v_applied := v_next - v_credits;

  IF v_applied = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', CASE WHEN p_delta > 0
        THEN 'This FAST Code™ already has the maximum of 99 free PIN credits.'
        ELSE 'This FAST Code™ has no free PIN credits to remove.' END,
      'freePinCredits', v_credits
    );
  END IF;

  UPDATE mapsites
  SET free_pin_credits = v_next,
      updated_at = now()
  WHERE id = p_mapsite_id;

  INSERT INTO mapsite_free_pin_grants (
    mapsite_id, fast_code, delta, balance_after, granted_by, note
  ) VALUES (
    p_mapsite_id,
    COALESCE(v_fast_code, ''),
    v_applied,
    v_next,
    trim(p_granted_by),
    NULLIF(left(trim(COALESCE(p_note, '')), 500), '')
  );

  RETURN jsonb_build_object(
    'ok', true,
    'applied', v_applied,
    'freePinCredits', v_next
  );
END;
$$;

-- Owner checkout: spend free credits to raise pin_quota without Stripe.
CREATE OR REPLACE FUNCTION redeem_mapsite_free_pins(
  p_mapsite_id uuid,
  p_quantity integer,
  p_email text,
  p_fast_code text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_quota integer;
  v_purchased integer;
  v_credits integer;
  v_unit constant integer := 700;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid PIN quantity.');
  END IF;

  SELECT pin_quota, purchased_pins, COALESCE(free_pin_credits, 0)
  INTO v_quota, v_purchased, v_credits
  FROM mapsites
  WHERE id = p_mapsite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Mapsite™ was not found.');
  END IF;

  v_quota := GREATEST(1, LEAST(100, COALESCE(v_quota, 1)));
  v_purchased := GREATEST(0, LEAST(99, COALESCE(v_purchased, 0)));
  v_quota := GREATEST(v_quota, LEAST(100, 1 + v_purchased));

  IF v_credits < p_quantity THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Not enough free PIN credits.',
      'freePinCredits', v_credits
    );
  END IF;

  IF v_quota + p_quantity > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This Mapsite™ would pass the 100 PIN limit.');
  END IF;

  v_quota := v_quota + p_quantity;
  v_credits := v_credits - p_quantity;

  UPDATE mapsites
  SET pin_quota = v_quota,
      free_pin_credits = v_credits,
      updated_at = now()
  WHERE id = p_mapsite_id;

  INSERT INTO mapsite_pin_purchases (
    mapsite_id,
    quantity,
    granted_quantity,
    free_quantity,
    unit_amount_cents,
    currency,
    stripe_checkout_session_id,
    payment_status,
    email,
    fast_code,
    fulfilled_at
  ) VALUES (
    p_mapsite_id,
    p_quantity,
    p_quantity,
    p_quantity,
    v_unit,
    'cad',
    NULL,
    'free',
    p_email,
    p_fast_code,
    now()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'redeemed', p_quantity,
    'pinQuota', v_quota,
    'purchasedPins', v_purchased,
    'freePinCredits', v_credits
  );
END;
$$;

-- Atomic, idempotent grant after Stripe Checkout succeeds ($7 CAD per PIN).
CREATE OR REPLACE FUNCTION grant_mapsite_additional_pins(
  p_mapsite_id uuid,
  p_quantity integer,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_total integer,
  p_currency text,
  p_email text,
  p_fast_code text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing mapsite_pin_purchases%ROWTYPE;
  v_had_purchase boolean;
  v_quota integer;
  v_purchased integer;
  v_granted integer;
  v_unit constant integer := 700;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing Checkout session.');
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid PIN quantity.');
  END IF;

  IF lower(coalesce(p_currency, '')) <> 'cad'
     OR p_amount_total IS DISTINCT FROM (p_quantity * v_unit) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment amount does not match $7 CAD per PIN.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_session_id));

  SELECT * INTO v_existing
  FROM mapsite_pin_purchases
  WHERE stripe_checkout_session_id = p_session_id;
  v_had_purchase := FOUND;

  IF v_had_purchase AND v_existing.payment_status = 'completed' THEN
    SELECT pin_quota, purchased_pins INTO v_quota, v_purchased
    FROM mapsites
    WHERE id = v_existing.mapsite_id;
    RETURN jsonb_build_object(
      'ok', true,
      'alreadyProcessed', true,
      'pinQuota', COALESCE(v_quota, 1),
      'purchasedPins', COALESCE(v_purchased, 0),
      'granted', COALESCE(v_existing.granted_quantity, 0)
    );
  END IF;

  IF v_had_purchase AND v_existing.mapsite_id IS DISTINCT FROM p_mapsite_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Checkout session does not match this Mapsite™.');
  END IF;

  SELECT pin_quota, purchased_pins INTO v_quota, v_purchased
  FROM mapsites
  WHERE id = p_mapsite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Mapsite™ was not found.');
  END IF;

  v_quota := GREATEST(1, LEAST(100, COALESCE(v_quota, 1)));
  v_purchased := GREATEST(0, LEAST(99, COALESCE(v_purchased, 0)));
  v_granted := LEAST(p_quantity, GREATEST(100 - v_quota, 0));
  v_purchased := LEAST(99, v_purchased + v_granted, v_quota + v_granted - 1);
  v_quota := LEAST(100, v_quota + v_granted);

  UPDATE mapsites
  SET pin_quota = v_quota,
      purchased_pins = v_purchased,
      updated_at = now()
  WHERE id = p_mapsite_id;

  IF v_had_purchase THEN
    UPDATE mapsite_pin_purchases
    SET payment_status = 'completed',
        granted_quantity = v_granted,
        quantity = p_quantity,
        unit_amount_cents = v_unit,
        currency = 'cad',
        stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
        fulfilled_at = now(),
        email = COALESCE(p_email, email),
        fast_code = COALESCE(p_fast_code, fast_code)
    WHERE id = v_existing.id;
  ELSE
    INSERT INTO mapsite_pin_purchases (
      mapsite_id,
      quantity,
      granted_quantity,
      unit_amount_cents,
      currency,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      payment_status,
      email,
      fast_code,
      fulfilled_at
    ) VALUES (
      p_mapsite_id,
      p_quantity,
      v_granted,
      v_unit,
      'cad',
      p_session_id,
      p_payment_intent_id,
      'completed',
      p_email,
      p_fast_code,
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'alreadyProcessed', false,
    'pinQuota', v_quota,
    'purchasedPins', v_purchased,
    'granted', v_granted
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_grant_mapsite_free_pins(uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_mapsite_free_pins(uuid, integer, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION redeem_mapsite_free_pins(uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_mapsite_free_pins(uuid, integer, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION grant_mapsite_additional_pins(
  uuid, integer, text, text, integer, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_mapsite_additional_pins(
  uuid, integer, text, text, integer, text, text, text
) TO service_role;
