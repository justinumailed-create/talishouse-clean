ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS offered_subscription_tier TEXT NOT NULL DEFAULT 'root',
  ADD COLUMN IF NOT EXISTS interest_form_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE mapsites
  DROP CONSTRAINT IF EXISTS mapsites_offered_subscription_tier_check;

ALTER TABLE mapsites
  ADD CONSTRAINT mapsites_offered_subscription_tier_check
  CHECK (offered_subscription_tier IN ('root', 'derivative', 'adpro'));

UPDATE mapsites
SET offered_subscription_tier = 'root', interest_form_enabled = true
WHERE lower(fast_code) = 'lrg1';
