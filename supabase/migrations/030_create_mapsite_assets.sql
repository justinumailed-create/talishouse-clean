-- Create mapsite_assets table for Talispros Build System media storage
CREATE TABLE IF NOT EXISTS mapsite_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES build_requests(id),
  profile_image TEXT,
  logo_image TEXT,
  pin_image TEXT,
  monologue_pdf TEXT,
  ebook_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mapsite_assets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage mapsite_assets" ON mapsite_assets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can view (images are served publicly)
CREATE POLICY "Anon users can view mapsite_assets" ON mapsite_assets
  FOR SELECT
  TO anon
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mapsite_assets_request_id ON mapsite_assets(request_id);
