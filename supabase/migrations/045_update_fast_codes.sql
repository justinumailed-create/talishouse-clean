ALTER TABLE fast_codes ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE fast_codes ADD COLUMN IF NOT EXISTS mapsite_id UUID REFERENCES mapsites(id);

DROP POLICY IF EXISTS "Anon users can insert fast_codes" ON fast_codes;
CREATE POLICY "Anon users can insert fast_codes" ON fast_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);
