-- Extended MapSite fields for production template and admin editor
ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS property_description TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS header_image_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS map_zoom INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Allow public to view published mapsites (active) and keep draft/inactive private
DROP POLICY IF EXISTS "Public can view active mapsites" ON mapsites;
CREATE POLICY "Public can view active mapsites" ON mapsites
  FOR SELECT
  TO public
  USING (status = 'active');
