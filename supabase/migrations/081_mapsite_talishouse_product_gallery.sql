-- Refresh demonstration MapSite listing media to Talishouse™ product images.

UPDATE mapsites
SET
  cover_image = '/images/talishouse/recreational/400.png',
  header_image_url = '/images/talishouse/recreational/400.png',
  gallery_images = ARRAY[
    '/images/talishouse/recreational/400.png',
    '/images/talishouse/recreational/800.png',
    '/images/talishouse/residential/models/1600.png',
    '/images/talishouse/residential/hero.jpg'
  ]::TEXT[],
  updated_at = NOW()
WHERE is_demonstration = TRUE
  AND (
    cover_image IS NULL
    OR cover_image LIKE '%/images/mapsites/lrg1-gallery/%'
    OR header_image_url LIKE '%/images/mapsites/lrg1-gallery/%'
  );
