-- MapSite™ platform state machine + resource URLs for the fullscreen application.

ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS mls_url TEXT,
  ADD COLUMN IF NOT EXISTS broker_url TEXT,
  ADD COLUMN IF NOT EXISTS teb_url TEXT,
  ADD COLUMN IF NOT EXISTS ttv_url TEXT,
  ADD COLUMN IF NOT EXISTS assigned_marketing_manager TEXT,
  ADD COLUMN IF NOT EXISTS is_demonstration BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill cover_image from existing header imagery when present.
UPDATE mapsites
SET cover_image = COALESCE(cover_image, header_image_url, og_image_url)
WHERE cover_image IS NULL
  AND COALESCE(header_image_url, og_image_url) IS NOT NULL;

-- Allow platform lifecycle statuses while retaining legacy draft/active values.
ALTER TABLE mapsites DROP CONSTRAINT IF EXISTS mapsites_platform_status_check;

ALTER TABLE mapsites
  ADD CONSTRAINT mapsites_platform_status_check
  CHECK (
    status IN (
      'unclaimed',
      'build_request_submitted',
      'marketing_review',
      'active',
      'archived',
      'draft'
    )
  );

DROP POLICY IF EXISTS "Public can view active mapsites" ON mapsites;

CREATE POLICY "Public can view platform mapsites" ON mapsites
  FOR SELECT
  TO public
  USING (
    status IN (
      'active',
      'draft',
      'unclaimed',
      'build_request_submitted',
      'marketing_review'
    )
  );

CREATE INDEX IF NOT EXISTS idx_mapsites_is_demonstration
  ON mapsites (is_demonstration)
  WHERE is_demonstration = TRUE;

-- Seed the demonstration unclaimed market pin for /talispros/mapsite.
INSERT INTO mapsites (
  id,
  fast_code,
  slug,
  account_type,
  owner_first_name,
  owner_last_name,
  email,
  phone,
  status,
  property_title,
  property_address,
  property_description,
  latitude,
  longitude,
  cover_image,
  header_image_url,
  gallery_images,
  map_zoom,
  is_demonstration,
  meta_title,
  meta_description
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'DEMO',
  'demo-unclaimed',
  'demonstration',
  'Talispros',
  'Demonstration',
  'demo@talispros.com',
  '',
  'unclaimed',
  'Lot + optional Tiny Home',
  'Lot 8, South Head Road, Homeville, Nova Scotia, Canada.',
  'It''s a million dollar neighbourhood. A driveway and building site were prepared some years ago. May come with a Tiny Home guest house to stay in, while you build your dream home.',
  46.088287,
  -59.882749,
  '/images/mapsites/lrg1-gallery/09.png',
  '/images/mapsites/lrg1-gallery/09.png',
  ARRAY[
    '/images/mapsites/lrg1-gallery/09.png',
    '/images/mapsites/lrg1-gallery/02.png'
  ]::TEXT[],
  14,
  TRUE,
  'Talispros™ MapSite™ Demonstration',
  'Claim your market on the Talispros™ MapSite™.'
)
ON CONFLICT (fast_code) DO UPDATE
SET
  status = CASE
    WHEN mapsites.status IN ('active', 'build_request_submitted', 'marketing_review', 'archived')
      THEN mapsites.status
    ELSE 'unclaimed'
  END,
  is_demonstration = TRUE,
  latitude = COALESCE(mapsites.latitude, EXCLUDED.latitude),
  longitude = COALESCE(mapsites.longitude, EXCLUDED.longitude),
  cover_image = COALESCE(mapsites.cover_image, EXCLUDED.cover_image),
  property_title = COALESCE(mapsites.property_title, EXCLUDED.property_title),
  property_address = COALESCE(mapsites.property_address, EXCLUDED.property_address),
  property_description = COALESCE(mapsites.property_description, EXCLUDED.property_description),
  updated_at = NOW();
