-- Heal Ralf Meyer’s ~$1 Root Mapsite™ after a paid Stripe Checkout that did
-- not write talispros_payments / mapsites paid state.
--
-- Identity (do NOT use email LIKE 'ralf%'):
--   Name:  Ralf Meyer / Ralf P. Meyer
--   Email: rememcom@mac.com
--   Phone: 902-317-2223
-- Amount: CAD $1.00 + GST = 114 cents (ROOT_ACCOUNT_1). FSBO uses the same plan.
--
-- 1. Run scripts/trace-stripe-mapsite-root-payment.ts with live Stripe + Supabase
--    keys and --email rememcom@mac.com. Copy cs_…, mapsite uuid, FAST code.
-- 2. Confirm THAT session is paid ROOT_ACCOUNT_1 for rememcom@mac.com.
-- 3. Fill the placeholders below. Do not run against unpaid users.
--
-- Preferred (applies payment + mapsite + claim from the Stripe session):
--   npx tsx scripts/trace-stripe-mapsite-root-payment.ts --activate-session cs_...
--
-- After deploy of the Mapsite unlock PR, visiting the claimed Mapsite (or the
-- original success URL with session_id=cs_…) also reconciles from Stripe.

-- Inspect
SELECT id, email, plan_type, payment_status, stripe_checkout_session_id,
       mapsite_id, request_id, fast_code, created_at
FROM talispros_payments
WHERE lower(email) = 'remecom@mac.com'
   OR lower(email) LIKE '%remecom%'
   OR lower(email) LIKE '%meyer%'
ORDER BY created_at DESC;

SELECT id, email, fast_code, status, interest_form_enabled, updated_at
FROM mapsites
WHERE lower(email) = 'remecom@mac.com'
   OR lower(email) LIKE '%remecom%'
   OR lower(fast_code) LIKE '%rm%'
ORDER BY updated_at DESC NULLS LAST;

SELECT id, email, linked_mapsite_id, requested_fast_code, status,
       approval_status, activated_at
FROM build_requests
WHERE lower(email) = 'remecom@mac.com'
   OR lower(email) LIKE '%remecom%'
ORDER BY created_at DESC;

-- After confirming <cs_session>, <mapsite-uuid>, <fast-code>, <payment-uuid or new row>:
-- UPDATE talispros_payments
-- SET mapsite_id = '<mapsite-uuid>',
--     fast_code = '<fast-code>',
--     payment_status = 'completed',
--     stripe_checkout_session_id = COALESCE(stripe_checkout_session_id, '<cs_session>')
-- WHERE id = '<payment-uuid>';
--
-- UPDATE mapsites
-- SET status = 'active',
--     interest_form_enabled = true
-- WHERE id = '<mapsite-uuid>';
--
-- UPDATE build_requests
-- SET status = 'Mapsite™ Active',
--     approval_status = 'Approved',
--     activated_at = now(),
--     linked_mapsite_id = '<mapsite-uuid>'
-- WHERE id = '<request-uuid>';
