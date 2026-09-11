-- Link Mapsite™ activation payments to the Mapsite™ / claim they belong to.
-- Paid unlock previously keyed only on email, so a completed $1 Root payment
-- could miss the UI if mapsite.email, the claim email, and the payment email
-- did not match. Backfill heals existing completed rows (including Ralf).

ALTER TABLE talispros_payments
  ADD COLUMN IF NOT EXISTS mapsite_id UUID,
  ADD COLUMN IF NOT EXISTS request_id UUID,
  ADD COLUMN IF NOT EXISTS fast_code TEXT;

CREATE INDEX IF NOT EXISTS talispros_payments_mapsite_id_idx
  ON talispros_payments (mapsite_id)
  WHERE mapsite_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS talispros_payments_request_id_idx
  ON talispros_payments (request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS talispros_payments_fast_code_idx
  ON talispros_payments (lower(fast_code))
  WHERE fast_code IS NOT NULL;

-- Latest mapsite per email (completed payments only).
UPDATE talispros_payments p
SET
  mapsite_id = COALESCE(p.mapsite_id, sub.id),
  fast_code = COALESCE(NULLIF(btrim(p.fast_code), ''), sub.fast_code)
FROM (
  SELECT DISTINCT ON (lower(email))
    id,
    email,
    fast_code
  FROM mapsites
  WHERE email IS NOT NULL
    AND btrim(email) <> ''
  ORDER BY lower(email), updated_at DESC NULLS LAST, created_at DESC NULLS LAST
) sub
WHERE lower(p.email) = lower(sub.email)
  AND p.payment_status ILIKE 'completed'
  AND (p.mapsite_id IS NULL OR p.fast_code IS NULL OR btrim(p.fast_code) = '');

-- Latest claim request per email.
UPDATE talispros_payments p
SET
  request_id = COALESCE(p.request_id, sub.id),
  mapsite_id = COALESCE(p.mapsite_id, sub.linked_mapsite_id),
  fast_code = COALESCE(
    NULLIF(btrim(p.fast_code), ''),
    sub.requested_fast_code
  )
FROM (
  SELECT DISTINCT ON (lower(email))
    id,
    email,
    linked_mapsite_id,
    requested_fast_code
  FROM build_requests
  WHERE email IS NOT NULL
    AND btrim(email) <> ''
  ORDER BY lower(email), created_at DESC NULLS LAST
) sub
WHERE lower(p.email) = lower(sub.email)
  AND p.payment_status ILIKE 'completed'
  AND (
    p.request_id IS NULL
    OR p.mapsite_id IS NULL
    OR p.fast_code IS NULL
    OR btrim(p.fast_code) = ''
  );
