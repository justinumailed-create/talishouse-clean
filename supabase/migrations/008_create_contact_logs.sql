-- Create contact_logs table
CREATE TABLE IF NOT EXISTS contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fast_code TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can manage contact_logs" ON contact_logs;
CREATE POLICY "Authenticated users can manage contact_logs" ON contact_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
DROP POLICY IF EXISTS "Anon users can insert contact_logs" ON contact_logs;
CREATE POLICY "Anon users can insert contact_logs" ON contact_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon users can view contact_logs" ON contact_logs;
CREATE POLICY "Anon users can view contact_logs" ON contact_logs
  FOR SELECT
  TO anon
  USING (true);

-- Add contact_phone to users table (admin-controlled)
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_phone TEXT;
  END IF;
END $$;
