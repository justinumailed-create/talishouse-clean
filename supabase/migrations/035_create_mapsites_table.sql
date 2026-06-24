-- Create mapsites table for MapSite™ registration system
CREATE TABLE IF NOT EXISTS mapsites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'standard',
  owner_first_name TEXT NOT NULL,
  owner_last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mapsites ENABLE ROW LEVEL SECURITY;

-- Public can read active mapsites
CREATE POLICY "Public can view active mapsites" ON mapsites
  FOR SELECT
  TO public
  USING (status = 'active');

-- Service role / authenticated can manage
CREATE POLICY "Authenticated users can manage mapsites" ON mapsites
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon inserts for registration flow
CREATE POLICY "Anon users can insert mapsites" ON mapsites
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mapsites_slug ON mapsites(slug);
CREATE INDEX IF NOT EXISTS idx_mapsites_fast_code ON mapsites(fast_code);
CREATE INDEX IF NOT EXISTS idx_mapsites_email ON mapsites(email);
CREATE INDEX IF NOT EXISTS idx_mapsites_status ON mapsites(status);
CREATE INDEX IF NOT EXISTS idx_mapsites_created_at ON mapsites(created_at DESC);
