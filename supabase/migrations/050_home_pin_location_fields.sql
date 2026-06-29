-- Home PIN Location fields for Build A MapSite requests
ALTER TABLE build_requests
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pin_writeup TEXT,
  ADD COLUMN IF NOT EXISTS future_pin_color TEXT,
  ADD COLUMN IF NOT EXISTS future_pin_icon TEXT,
  ADD COLUMN IF NOT EXISTS future_pin_border TEXT,
  ADD COLUMN IF NOT EXISTS future_pin_label TEXT;
