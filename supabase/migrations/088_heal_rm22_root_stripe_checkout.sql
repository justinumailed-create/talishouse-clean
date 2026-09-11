-- Heal Ralf Meyer’s paid $1 Root Stripe Checkout (rm22) that did not write
-- talispros_payments / mapsite paid state. Production claimed page still
-- rendered paymentReceived:false and status BUILD_REQUEST_SUBMITTED.
--
-- Stripe (live):
--   cs_live_a1HDZFAOXDurFbaM9Z23BRuX5CJicnXKjcRsWvpbA31Xs43NTxLU2Q5x2i
--   pi_3UE6jlKOU1jILB1s1QTXPuw2  (succeeded, CAD 114, ROOT_ACCOUNT_1, brokers)
--   email rememcom@mac.com
--
-- Scoped to this Checkout session / Mapsite / claim only. Does not mark
-- other users paid. Requires 087 mapsite_id columns.

INSERT INTO talispros_payments (
  email,
  plan_type,
  payment_provider,
  stripe_checkout_session_id,
  stripe_payment_intent_id,
  payment_status,
  mapsite_id,
  request_id,
  fast_code
)
SELECT
  'remecom@mac.com',
  'ROOT_ACCOUNT_1',
  'stripe',
  'cs_live_a1HDZFAOXDurFbaM9Z23BRuX5CJicnXKjcRsWvpbA31Xs43NTxLU2Q5x2i',
  'pi_3UE6jlKOU1jILB1s1QTXPuw2',
  'completed',
  '10d37811-43f6-4598-9ceb-d102ba6088d8',
  '4b91dd3a-a841-40c4-a61d-8800d4a49b53',
  'rm22'
WHERE NOT EXISTS (
  SELECT 1
  FROM talispros_payments
  WHERE stripe_checkout_session_id =
    'cs_live_a1HDZFAOXDurFbaM9Z23BRuX5CJicnXKjcRsWvpbA31Xs43NTxLU2Q5x2i'
);

UPDATE talispros_payments
SET
  email = 'remecom@mac.com',
  plan_type = 'ROOT_ACCOUNT_1',
  payment_provider = 'stripe',
  stripe_payment_intent_id = 'pi_3UE6jlKOU1jILB1s1QTXPuw2',
  payment_status = 'completed',
  mapsite_id = '10d37811-43f6-4598-9ceb-d102ba6088d8',
  request_id = '4b91dd3a-a841-40c4-a61d-8800d4a49b53',
  fast_code = 'rm22'
WHERE stripe_checkout_session_id =
  'cs_live_a1HDZFAOXDurFbaM9Z23BRuX5CJicnXKjcRsWvpbA31Xs43NTxLU2Q5x2i';

UPDATE mapsites
SET
  status = 'active',
  interest_form_enabled = true,
  fast_code = COALESCE(NULLIF(btrim(fast_code), ''), 'rm22')
WHERE id = '10d37811-43f6-4598-9ceb-d102ba6088d8';

UPDATE build_requests
SET
  status = 'Mapsite™ Active',
  approval_status = 'Approved',
  activated_at = COALESCE(activated_at, now()),
  linked_mapsite_id = '10d37811-43f6-4598-9ceb-d102ba6088d8',
  requested_fast_code = COALESCE(NULLIF(btrim(requested_fast_code), ''), 'rm22')
WHERE id = '4b91dd3a-a841-40c4-a61d-8800d4a49b53';
