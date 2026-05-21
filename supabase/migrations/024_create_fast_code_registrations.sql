-- Create fast_code_registrations table for Phase One Fast Code Automation
CREATE TABLE IF NOT EXISTS fast_code_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  cell_phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fast_code_registrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage fast_code_registrations" ON fast_code_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can insert (needed for the generator form)
CREATE POLICY "Anon users can insert fast_code_registrations" ON fast_code_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon users can select (needed to count existing codes for generation)
CREATE POLICY "Anon users can view fast_code_registrations" ON fast_code_registrations
  FOR SELECT
  TO anon
  USING (true);

-- Index for fast lookups by prefix pattern (used in duplicate-initial counting)
CREATE INDEX IF NOT EXISTS idx_fcr_fast_code ON fast_code_registrations(fast_code);
CREATE INDEX IF NOT EXISTS idx_fcr_created_at ON fast_code_registrations(created_at);
