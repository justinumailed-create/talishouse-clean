-- Create deals table (v2)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name TEXT,
  phone TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'new',
  value NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure v2 columns exist even when deals table was created by older migrations
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS value NUMERIC;

-- Add FK only when users table exists (for out-of-order legacy migration sets)
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'deals_user_id_fkey'
    ) THEN
      ALTER TABLE deals
        ADD CONSTRAINT deals_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can manage deals" ON deals;
CREATE POLICY "Authenticated users can manage deals" ON deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
DROP POLICY IF EXISTS "Anon users can view deals" ON deals;
CREATE POLICY "Anon users can view deals" ON deals
  FOR SELECT
  TO anon
  USING (true);

-- Create index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
