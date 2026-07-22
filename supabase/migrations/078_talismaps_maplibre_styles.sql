-- Migrate TalisMaps™ platform settings to MapLibre + Satellite default styles.
-- Google Maps and Leaflet OSM are no longer valid provider ids.

ALTER TABLE talismaps_platform_settings
  DROP CONSTRAINT IF EXISTS talismaps_platform_settings_default_provider_id_check;

ALTER TABLE talismaps_platform_settings
  DROP CONSTRAINT IF EXISTS talismaps_platform_settings_default_basemap_view_check;

UPDATE talismaps_platform_settings
SET default_provider_id = 'maplibre'
WHERE default_provider_id IN ('leaflet-osm', 'google-maps');

UPDATE talismaps_platform_settings
SET default_basemap_view = 'satellite'
WHERE default_basemap_view = 'hybrid'
   OR default_basemap_view = 'street'
   OR default_basemap_view IS NULL;

ALTER TABLE talismaps_platform_settings
  ALTER COLUMN default_provider_id SET DEFAULT 'maplibre';

ALTER TABLE talismaps_platform_settings
  ALTER COLUMN default_basemap_view SET DEFAULT 'satellite';

ALTER TABLE talismaps_platform_settings
  ADD CONSTRAINT talismaps_platform_settings_default_provider_id_check
  CHECK (default_provider_id IN ('maplibre', 'mapbox', 'esri'));

ALTER TABLE talismaps_platform_settings
  ADD CONSTRAINT talismaps_platform_settings_default_basemap_view_check
  CHECK (default_basemap_view IN ('satellite', 'street', 'terrain', 'light', 'dark'));

UPDATE talismaps_platform_settings
SET
  default_provider_id = 'maplibre',
  default_basemap_view = 'satellite'
WHERE id = 'global';
