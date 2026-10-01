-- Additional Mapsite™ PINs.
-- Each Mapsite™ includes 1 PIN (mapsites.latitude/longitude).
-- Owners buy more at $10 USD each. pin_quota is the total allowed (max 100).
-- purchased_pins is how many extras were paid for.
-- Placed extras live in mapsite_additional_pins (not the included PIN).

ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS pin_quota integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS purchased_pins integer NOT NULL DEFAULT 0;

ALTER TABLE mapsites
  DROP CONSTRAINT IF EXISTS mapsites_pin_quota_range,
  DROP CONSTRAINT IF EXISTS mapsites_purchased_pins_range,
  DROP CONSTRAINT IF EXISTS mapsites_purchased_within_quota;

ALTER TABLE mapsites
  ADD CONSTRAINT mapsites_pin_quota_range CHECK (pin_quota >= 1 AND pin_quota <= 100),
  ADD CONSTRAINT mapsites_purchased_pins_range CHECK (purchased_pins >= 0 AND purchased_pins <= 99),
  ADD CONSTRAINT mapsites_purchased_within_quota CHECK (purchased_pins <= pin_quota - 1);

CREATE TABLE IF NOT EXISTS mapsite_additional_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapsite_id uuid NOT NULL REFERENCES mapsites(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mapsite_additional_pins_mapsite
  ON mapsite_additional_pins (mapsite_id, sort_order);

ALTER TABLE mapsite_additional_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view Mapsite additional PINs" ON mapsite_additional_pins;
CREATE POLICY "Public can view Mapsite additional PINs"
  ON mapsite_additional_pins
  FOR SELECT
  TO public
  USING (true);

CREATE TABLE IF NOT EXISTS mapsite_pin_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapsite_id uuid NOT NULL REFERENCES mapsites(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  granted_quantity integer CHECK (granted_quantity IS NULL OR (granted_quantity >= 0 AND granted_quantity <= 99)),
  unit_amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id text NOT NULL,
  stripe_payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  email text,
  fast_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS mapsite_pin_purchases_session_uidx
  ON mapsite_pin_purchases (stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_mapsite_pin_purchases_mapsite
  ON mapsite_pin_purchases (mapsite_id, created_at DESC);

ALTER TABLE mapsite_pin_purchases ENABLE ROW LEVEL SECURITY;

-- Blocks placing more additional PINs than pin_quota allows (quota includes the original PIN).
CREATE OR REPLACE FUNCTION enforce_mapsite_additional_pin_quota()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_quota integer;
  v_count integer;
BEGIN
  SELECT COALESCE(pin_quota, 1) INTO v_quota
  FROM mapsites
  WHERE id = NEW.mapsite_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mapsite™ was not found.';
  END IF;

  SELECT count(*) INTO v_count
  FROM mapsite_additional_pins
  WHERE mapsite_id = NEW.mapsite_id
    AND id IS DISTINCT FROM NEW.id;

  IF v_count + 1 > GREATEST(v_quota, 1) - 1 THEN
    RAISE EXCEPTION 'PIN quota exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mapsite_additional_pins_quota ON mapsite_additional_pins;
CREATE TRIGGER mapsite_additional_pins_quota
  BEFORE INSERT ON mapsite_additional_pins
  FOR EACH ROW
  EXECUTE FUNCTION enforce_mapsite_additional_pin_quota();

-- Atomic, idempotent grant after Stripe Checkout succeeds.
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
  v_unit constant integer := 1000;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing Checkout session.');
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid PIN quantity.');
  END IF;

  IF lower(coalesce(p_currency, '')) <> 'usd'
     OR p_amount_total IS DISTINCT FROM (p_quantity * v_unit) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment amount does not match $10 USD per PIN.');
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
  v_purchased := LEAST(99, v_purchased + v_granted);
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
        currency = 'usd',
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
      'usd',
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

REVOKE ALL ON FUNCTION enforce_mapsite_additional_pin_quota() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION grant_mapsite_additional_pins(
  uuid, integer, text, text, integer, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_mapsite_additional_pins(
  uuid, integer, text, text, integer, text, text, text
) TO service_role;
