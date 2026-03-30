-- Create associates table
CREATE TABLE IF NOT EXISTS associates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  fast_code TEXT UNIQUE NOT NULL,
  intro_message TEXT,
  images TEXT[] DEFAULT '{}',
  page_headline TEXT,
  page_subtext TEXT,
  page_contact_cta TEXT,
  page_footer_note TEXT,
  page_custom_message TEXT,
  is_page_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE associates ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage associates" ON associates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users
CREATE POLICY "Anon users can view associates" ON associates
  FOR SELECT
  TO anon
  USING (true);

-- Create index for fast_code lookup
CREATE INDEX IF NOT EXISTS idx_associates_fast_code ON associates(fast_code);
