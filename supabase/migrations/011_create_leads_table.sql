-- Migration: 011_create_leads_table.sql
-- Creates the leads table for capturing lead submissions

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT DEFAULT '',
  fast_code TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted')),
  project_value NUMERIC(12, 2) DEFAULT 0,
  commission_rate NUMERIC(5, 2) DEFAULT 0,
  split_percentage NUMERIC(5, 2) DEFAULT 0,
  deal_status TEXT DEFAULT 'none' CHECK (deal_status IN ('none', 'pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (full access)
CREATE POLICY "Authenticated users can manage leads" ON leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users (insert and select only)
CREATE POLICY "Anon users can insert leads" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can view leads" ON leads
  FOR SELECT
  TO anon
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_fast_code ON leads(fast_code);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
