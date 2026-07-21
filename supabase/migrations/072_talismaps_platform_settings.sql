-- Global TalisMaps™ platform settings (singleton row)
CREATE TABLE IF NOT EXISTS talismaps_platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  default_provider_id TEXT NOT NULL DEFAULT 'leaflet-osm'
    CHECK (default_provider_id IN ('leaflet-osm', 'mapbox', 'google-maps', 'esri')),
  default_basemap_view TEXT NOT NULL DEFAULT 'street'
    CHECK (default_basemap_view IN ('street', 'satellite', 'hybrid', 'terrain')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO talismaps_platform_settings (id, default_provider_id, default_basemap_view)
VALUES ('global', 'leaflet-osm', 'street')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE talismaps_platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read talismaps platform settings"
  ON talismaps_platform_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage talismaps platform settings"
  ON talismaps_platform_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
