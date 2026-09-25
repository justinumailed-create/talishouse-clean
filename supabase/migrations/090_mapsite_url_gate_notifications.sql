-- Visitor-generated Mapsite™ URL gate codes ship to Global Admin Notifications.
-- Codes are 6 digits, single-use, and expire after 30 minutes (enforced in app).

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx
  ON admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx
  ON admin_notifications (created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE admin_notifications FROM anon, authenticated, public;

COMMENT ON TABLE admin_notifications IS
  'Global Admin in-app notifications (e.g. Mapsite™ URL gate secure codes).';

ALTER TABLE mapsite_url_gate_pins
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS notification_id UUID;

COMMENT ON COLUMN mapsite_url_gate_pins.source IS
  'Who triggered generation: visitor | admin';

COMMENT ON COLUMN mapsite_url_gate_pins.expires_at IS
  'PIN is invalid after this time (default 30 minutes from issue).';

COMMENT ON COLUMN mapsite_url_gate_pins.consumed_at IS
  'Set when the PIN successfully unlocks the listing URL (single-use).';

COMMENT ON TABLE mapsite_url_gate_pins IS
  '6-digit PIN hash required before the Mapsite™ URL button opens the submitted listing/payment URL. Visitor or admin generates; plaintext ships to admin_notifications.';
