-- Support Home PIN placement without a street address (vacant land, etc.)
ALTER TABLE build_requests
  ADD COLUMN IF NOT EXISTS manual_placement BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reverse_geocoded_address TEXT;
