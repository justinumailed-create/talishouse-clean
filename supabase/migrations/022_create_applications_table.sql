-- Create applications table for Propose a Project submissions
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  participation_level TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage applications" ON applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can insert applications" ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can view applications" ON applications
  FOR SELECT
  TO anon
  USING (true);

-- Create index for status lookup
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);