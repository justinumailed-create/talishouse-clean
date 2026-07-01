ALTER TABLE mapsites
  ADD COLUMN IF NOT EXISTS gallery_items JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE mapsites
SET gallery_items = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'url', url,
        'description', '',
        'sortOrder', ordinality - 1,
        'visible', true
      )
      ORDER BY ordinality
    )
    FROM unnest(gallery_images) WITH ORDINALITY AS gallery(url, ordinality)
  ),
  '[]'::jsonb
)
WHERE gallery_items = '[]'::jsonb
  AND cardinality(gallery_images) > 0;
