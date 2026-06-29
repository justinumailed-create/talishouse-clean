-- Enforce globally unique FAST Codes on accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_fast_code_unique
  ON accounts (lower(fast_code));
