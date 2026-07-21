-- TalisBooks™ Image Processor
-- Derived assets, orientation tracking, and storage bucket

-- ─── Image lineage & processing metadata ────────────────────────────────────

ALTER TABLE talisbooks_images
  ADD COLUMN IF NOT EXISTS parent_image_id UUID REFERENCES talisbooks_images(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS image_role TEXT NOT NULL DEFAULT 'original'
    CHECK (image_role IN ('original', 'derived_left', 'derived_right')),
  ADD COLUMN IF NOT EXISTS orientation TEXT
    CHECK (orientation IS NULL OR orientation IN ('landscape', 'portrait', 'square')),
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processed', 'skipped', 'failed'));

CREATE INDEX IF NOT EXISTS idx_talisbooks_images_parent_image_id
  ON talisbooks_images(parent_image_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_images_image_role
  ON talisbooks_images(image_role);
CREATE INDEX IF NOT EXISTS idx_talisbooks_images_processing_status
  ON talisbooks_images(processing_status);

-- ─── Storage bucket for originals + derived assets ──────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'talisbooks-assets',
  'talisbooks-assets',
  true,
  20971520,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view talisbooks-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'talisbooks-assets');

CREATE POLICY "Authenticated can upload talisbooks-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'talisbooks-assets');

CREATE POLICY "Authenticated can update talisbooks-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'talisbooks-assets')
WITH CHECK (bucket_id = 'talisbooks-assets');

CREATE POLICY "Service role can manage talisbooks-assets"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'talisbooks-assets')
WITH CHECK (bucket_id = 'talisbooks-assets');
