-- Create fast_codes table for Talispros Build System code management
CREATE TABLE IF NOT EXISTS fast_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  request_id UUID REFERENCES build_requests(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fast_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage fast_codes" ON fast_codes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can select (code lookup and validation)
CREATE POLICY "Anon users can view fast_codes" ON fast_codes
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fast_codes_code ON fast_codes(code);
CREATE INDEX IF NOT EXISTS idx_fast_codes_request_id ON fast_codes(request_id);
CREATE INDEX IF NOT EXISTS idx_fast_codes_type ON fast_codes(type);
