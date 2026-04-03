-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  fast_code TEXT UNIQUE,
  role TEXT DEFAULT 'associate',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage users" ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can view users" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Create index for fast_code lookup
CREATE INDEX IF NOT EXISTS idx_users_fast_code ON users(fast_code);
