-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_type TEXT,
  project_value NUMERIC(12, 2) DEFAULT 0,
  commission_percent NUMERIC(5, 2) DEFAULT 0,
  split_percent NUMERIC(5, 2) DEFAULT 0,
  earnings NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create index for lead_id lookup
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
