-- Add SPLITS fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS addons_value NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  fast_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT DEFAULT 'full',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON transactions;
CREATE POLICY "Authenticated users can manage transactions" ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
DROP POLICY IF EXISTS "Anon users can view transactions" ON transactions;
CREATE POLICY "Anon users can view transactions" ON transactions
  FOR SELECT
  TO anon
  USING (true);

-- Create index for fast_code lookup on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_fast_code ON transactions(fast_code);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  fast_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add FK to users only when users table exists
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'earnings_user_id_fkey'
    ) THEN
      ALTER TABLE earnings
        ADD CONSTRAINT earnings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can manage earnings" ON earnings;
CREATE POLICY "Authenticated users can manage earnings" ON earnings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
DROP POLICY IF EXISTS "Anon users can view earnings" ON earnings;
CREATE POLICY "Anon users can view earnings" ON earnings
  FOR SELECT
  TO anon
  USING (true);

-- Create index for user_id lookup on earnings
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);

-- Create index for fast_code lookup on earnings
CREATE INDEX IF NOT EXISTS idx_earnings_fast_code ON earnings(fast_code);
