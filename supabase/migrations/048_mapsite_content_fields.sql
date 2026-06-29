-- Optional MapSite presentation fields (populated from admin/build flows later)
ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS property_title TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';
