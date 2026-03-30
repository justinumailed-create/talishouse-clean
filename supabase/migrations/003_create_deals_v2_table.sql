-- Create deals table (v2)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name TEXT,
  phone TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'new',
  value NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage deals" ON deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can view deals" ON deals
  FOR SELECT
  TO anon
  USING (true);

-- Create index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
