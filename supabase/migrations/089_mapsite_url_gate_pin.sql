-- 6-digit URL gate PIN issued by Global Admin. Hash is never granted to anon.
CREATE TABLE IF NOT EXISTS mapsite_url_gate_pins (
  mapsite_id UUID PRIMARY KEY REFERENCES mapsites(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mapsite_url_gate_pins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE mapsite_url_gate_pins FROM anon, authenticated, public;

COMMENT ON TABLE mapsite_url_gate_pins IS
  'Admin-authorized 6-digit PIN hash required before the Mapsite™ URL button opens the submitted listing URL.';
