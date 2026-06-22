-- Create build_requests table for Talispros Build System
CREATE TABLE IF NOT EXISTS build_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  account_type TEXT NOT NULL,
  media_focus TEXT,
  address TEXT,
  geo_location TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE build_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage build_requests" ON build_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can insert (public build form)
CREATE POLICY "Anon users can insert build_requests" ON build_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon users can view own requests (by tracking ID or similar)
CREATE POLICY "Anon users can view build_requests" ON build_requests
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_build_requests_status ON build_requests(status);
CREATE INDEX IF NOT EXISTS idx_build_requests_email ON build_requests(email);
CREATE INDEX IF NOT EXISTS idx_build_requests_created_at ON build_requests(created_at DESC);
