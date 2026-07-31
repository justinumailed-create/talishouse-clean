-- Corporate Market architecture for future account ownership flows.
-- This migration adds only relational model primitives (no workflow changes).

CREATE TABLE IF NOT EXISTS corporate_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  pmc_pin_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE corporate_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage corporate_markets"
  ON corporate_markets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage corporate_markets"
  ON corporate_markets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_corporate_markets_status
  ON corporate_markets (status);

CREATE INDEX IF NOT EXISTS idx_corporate_markets_country_region
  ON corporate_markets (country, region);

CREATE TABLE IF NOT EXISTS corporate_market_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_market_id UUID NOT NULL REFERENCES corporate_markets(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_role TEXT NOT NULL
    CHECK (account_role IN ('root', 'derivative', 'fsbo', 'adpro')),
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id),
  UNIQUE (corporate_market_id, account_id),
  CONSTRAINT corporate_market_memberships_parent_rule CHECK (
    (account_role = 'root' AND parent_account_id IS NULL)
    OR (account_role IN ('derivative', 'fsbo', 'adpro') AND parent_account_id IS NOT NULL)
  ),
  CONSTRAINT corporate_market_memberships_parent_not_self CHECK (
    parent_account_id IS NULL OR parent_account_id <> account_id
  )
);

ALTER TABLE corporate_market_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage corporate_market_memberships"
  ON corporate_market_memberships
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage corporate_market_memberships"
  ON corporate_market_memberships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_corporate_market_memberships_market_role
  ON corporate_market_memberships (corporate_market_id, account_role);

CREATE INDEX IF NOT EXISTS idx_corporate_market_memberships_parent
  ON corporate_market_memberships (parent_account_id);

CREATE OR REPLACE FUNCTION update_corporate_markets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corporate_markets_updated_at ON corporate_markets;

CREATE TRIGGER corporate_markets_updated_at
  BEFORE UPDATE ON corporate_markets
  FOR EACH ROW
  EXECUTE FUNCTION update_corporate_markets_updated_at();

CREATE OR REPLACE FUNCTION update_corporate_market_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corporate_market_memberships_updated_at
  ON corporate_market_memberships;

CREATE TRIGGER corporate_market_memberships_updated_at
  BEFORE UPDATE ON corporate_market_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_corporate_market_memberships_updated_at();
