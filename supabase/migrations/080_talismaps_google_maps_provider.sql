-- Allow Google Maps as a TalisMaps™ platform provider.

ALTER TABLE talismaps_platform_settings
  DROP CONSTRAINT IF EXISTS talismaps_platform_settings_default_provider_id_check;

ALTER TABLE talismaps_platform_settings
  ADD CONSTRAINT talismaps_platform_settings_default_provider_id_check
  CHECK (
    default_provider_id IN ('google-maps', 'maplibre', 'mapbox', 'esri')
  );

ALTER TABLE talismaps_platform_settings
  ALTER COLUMN default_provider_id SET DEFAULT 'google-maps';

UPDATE talismaps_platform_settings
SET
  default_provider_id = 'google-maps',
  default_basemap_view = COALESCE(default_basemap_view, 'satellite')
WHERE id = 'global';
