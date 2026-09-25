-- ALLPINS aggregate Mapsite™: multi-pin showcase linked to the isolated shelf.
-- Pin rows are synced from live mapsite coordinates by ensureAllPinsMapSite()
-- (and seeded below from existing mapsite lat/lng).

INSERT INTO mapsites (
  fast_code,
  slug,
  account_type,
  owner_first_name,
  owner_last_name,
  agent_name,
  email,
  phone,
  status,
  property_title,
  property_address,
  property_description,
  latitude,
  longitude,
  map_zoom,
  gallery_images,
  is_demonstration,
  interest_form_enabled,
  offered_subscription_tier
)
VALUES (
  'allpins',
  'allpins',
  'Root Account™',
  'Talispros',
  'ALLPINS',
  'ALLPINS Showcase',
  'allpins@talispros.com',
  '',
  'active',
  'ALLPINS — Every Mapsite™',
  'Aggregated live Mapsite™ pins',
  'Showcase map of every Mapsite™ pin. Open a pin for the book and Mapsite™ demo.',
  45.0,
  -63.0,
  4,
  '{}',
  false,
  false,
  'root'
)
ON CONFLICT (fast_code) DO UPDATE
SET
  status = EXCLUDED.status,
  property_title = EXCLUDED.property_title,
  property_address = EXCLUDED.property_address,
  property_description = EXCLUDED.property_description,
  updated_at = now();

INSERT INTO fast_codes (code, type, account_type, mapsite_id)
SELECT
  'allpins',
  'root',
  'root',
  m.id
FROM mapsites m
WHERE lower(m.fast_code) = 'allpins'
ON CONFLICT (code) DO UPDATE
SET mapsite_id = EXCLUDED.mapsite_id;

-- Replace ALLPINS pin rows with one pin per existing Mapsite™ (real lat/lng).
DELETE FROM pins
WHERE mapsite_id = (SELECT id FROM mapsites WHERE lower(fast_code) = 'allpins');

INSERT INTO pins (
  mapsite_id,
  name,
  description,
  latitude,
  longitude,
  address,
  website,
  featured,
  sort_order
)
SELECT
  ap.id,
  left(
    upper(m.fast_code) || ' — ' || coalesce(
      nullif(trim(m.property_title), ''),
      nullif(trim(m.property_address), ''),
      upper(m.fast_code)
    ),
    120
  ),
  concat_ws(
    E'\n',
    nullif(trim(m.property_address), ''),
    CASE
      WHEN nullif(trim(m.teb_url), '') IS NOT NULL
        THEN 'Book: ' || trim(m.teb_url)
      ELSE NULL
    END,
    'Mapsite: /talispros/mapsite/listings/' || lower(m.fast_code)
  ),
  m.latitude,
  m.longitude,
  coalesce(m.property_address, ''),
  '/talispros/mapsite/listings/' || lower(m.fast_code),
  (row_number() OVER (ORDER BY m.created_at DESC NULLS LAST)) <= 3,
  (row_number() OVER (ORDER BY m.created_at DESC NULLS LAST) - 1)::int
FROM mapsites m
CROSS JOIN (
  SELECT id FROM mapsites WHERE lower(fast_code) = 'allpins'
) ap
WHERE m.latitude IS NOT NULL
  AND m.longitude IS NOT NULL
  AND lower(m.fast_code) <> 'allpins'
  AND nullif(trim(m.fast_code), '') IS NOT NULL
  AND m.id IN (
    SELECT DISTINCT ON (lower(fast_code)) id
    FROM mapsites
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND lower(fast_code) <> 'allpins'
    ORDER BY lower(fast_code), created_at DESC NULLS LAST
  );
