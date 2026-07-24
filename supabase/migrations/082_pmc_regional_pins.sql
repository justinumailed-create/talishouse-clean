-- Talispros™ PMC regional Root Account pins (brokers MapSite).
-- Defaults live in code; this table stores admin / marketing-manager overrides.

CREATE TABLE IF NOT EXISTS pmc_regional_pins (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL CHECK (country IN ('CA', 'US')),
  region_group TEXT NOT NULL CHECK (region_group IN ('canada', 'usa')),
  label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  map_zoom INTEGER NOT NULL DEFAULT 6,
  pin_color TEXT,
  logo_url TEXT,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pmc_regional_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view pmc regional pins"
  ON pmc_regional_pins
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage pmc regional pins"
  ON pmc_regional_pins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pmc_regional_pins_region_group
  ON pmc_regional_pins (region_group, sort_order);

CREATE INDEX IF NOT EXISTS idx_pmc_regional_pins_visible
  ON pmc_regional_pins (visible);
