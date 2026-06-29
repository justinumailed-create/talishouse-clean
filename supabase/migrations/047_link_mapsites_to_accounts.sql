-- Link accounts to users and classify account type
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);

-- Link mapsites to accounts and track updates
ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_mapsites_account_id ON mapsites(account_id);

CREATE OR REPLACE FUNCTION update_mapsites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mapsites_updated_at ON mapsites;

CREATE TRIGGER mapsites_updated_at
  BEFORE UPDATE ON mapsites
  FOR EACH ROW
  EXECUTE FUNCTION update_mapsites_updated_at();
