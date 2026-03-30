-- Add SPLITS fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS addons_value NUMERIC DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  fast_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT DEFAULT 'full',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage transactions" ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can view transactions" ON transactions
  FOR SELECT
  TO anon
  USING (true);

-- Create index for fast_code lookup on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_fast_code ON transactions(fast_code);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  fast_code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage earnings" ON earnings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can view earnings" ON earnings
  FOR SELECT
  TO anon
  USING (true);

-- Create index for user_id lookup on earnings
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);

-- Create index for fast_code lookup on earnings
CREATE INDEX IF NOT EXISTS idx_earnings_fast_code ON earnings(fast_code);
