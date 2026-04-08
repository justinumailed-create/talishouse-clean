-- Migration: 021_create_leads_match_table.sql
-- Creates the leads_match table for the Find Your Home matching experience

CREATE TABLE IF NOT EXISTS leads_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal TEXT,
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  timeline TEXT,
  location TEXT,
  home_type TEXT,
  home_size_sqft TEXT,
  financing_needed BOOLEAN,
  land_owned BOOLEAN,
  name TEXT,
  email TEXT,
  phone TEXT,
  recommended_product TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads_match ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users can insert leads_match" ON leads_match
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can view leads_match" ON leads_match
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_leads_match_created_at ON leads_match(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_match_goal ON leads_match(goal);
CREATE INDEX IF NOT EXISTS idx_leads_match_home_type ON leads_match(home_type);
