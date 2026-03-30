-- Create associate_applications table
CREATE TABLE IF NOT EXISTS associate_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  preferred_fast_code TEXT,
  role_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE associate_applications ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage applications" ON associate_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can insert applications" ON associate_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can view applications" ON associate_applications
  FOR SELECT
  TO anon
  USING (true);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_applications_status ON associate_applications(status);
