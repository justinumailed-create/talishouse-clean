-- Seed five premium TalisBooks™ cover templates + matching layouts

INSERT INTO talisbooks_templates (
  slug,
  name,
  description,
  template_type,
  preview_url,
  config,
  is_system,
  is_active
)
VALUES
  (
    'cover-aurora-frame',
    'Aurora Frame',
    'Centered title and subtitle over a full hero, framed by white top and bottom margins.',
    'cover',
    '',
    '{
      "coverId": "aurora-frame",
      "titlePlacement": "hero-center",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "fields": ["title", "subtitle", "heroImage"],
      "regions": { "topMargin": "white", "bottomMargin": "white", "hero": "image" }
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-horizon-caption',
    'Horizon Caption',
    'Hero dominates the middle band; title and subtitle sit in the white bottom margin.',
    'cover',
    '',
    '{
      "coverId": "horizon-caption",
      "titlePlacement": "bottom-band",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "fields": ["title", "subtitle", "heroImage"],
      "regions": { "topMargin": "white", "bottomMargin": "white", "hero": "image" }
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-masthead-rise',
    'Masthead Rise',
    'Modern masthead in the white top margin; hero fills the middle with a quiet bottom band.',
    'cover',
    '',
    '{
      "coverId": "masthead-rise",
      "titlePlacement": "top-band",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "fields": ["title", "subtitle", "heroImage"],
      "regions": { "topMargin": "white", "bottomMargin": "white", "hero": "image" }
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-cascade-editorial',
    'Cascade Editorial',
    'Asymmetric editorial: title in the top white margin, subtitle in the bottom white margin.',
    'cover',
    '',
    '{
      "coverId": "cascade-editorial",
      "titlePlacement": "top-left-bottom-right",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "fields": ["title", "subtitle", "heroImage"],
      "regions": { "topMargin": "white", "bottomMargin": "white", "hero": "image" }
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-vista-overlay',
    'Vista Overlay',
    'Lower-left title stack on the hero with white framing margins for a premium lookbook feel.',
    'cover',
    '',
    '{
      "coverId": "vista-overlay",
      "titlePlacement": "hero-lower-left",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "fields": ["title", "subtitle", "heroImage"],
      "regions": { "topMargin": "white", "bottomMargin": "white", "hero": "image" }
    }'::jsonb,
    TRUE,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  template_type = EXCLUDED.template_type,
  config = EXCLUDED.config,
  is_system = EXCLUDED.is_system,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO talisbooks_layouts (
  slug,
  name,
  description,
  layout_type,
  grid_config,
  css_classes,
  config,
  is_system,
  is_active
)
VALUES
  (
    'cover-aurora-frame',
    'Aurora Frame',
    'Centered title and subtitle over a full hero, framed by white top and bottom margins.',
    'cover',
    '{ "columns": 1, "rows": ["margin-top", "hero", "margin-bottom"], "centerfold": false }'::jsonb,
    'talisbooks-cover talisbooks-cover--aurora-frame',
    '{
      "coverId": "aurora-frame",
      "titlePlacement": "hero-center",
      "titleAlign": "center",
      "subtitleAlign": "center",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "hero": { "fit": "cover", "role": "hero" },
      "fields": ["title", "subtitle", "heroImage"]
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-horizon-caption',
    'Horizon Caption',
    'Hero dominates the middle band; title and subtitle sit in the white bottom margin.',
    'cover',
    '{ "columns": 1, "rows": ["margin-top", "hero", "margin-bottom"], "centerfold": false }'::jsonb,
    'talisbooks-cover talisbooks-cover--horizon-caption',
    '{
      "coverId": "horizon-caption",
      "titlePlacement": "bottom-band",
      "titleAlign": "left",
      "subtitleAlign": "left",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "hero": { "fit": "cover", "role": "hero" },
      "fields": ["title", "subtitle", "heroImage"]
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-masthead-rise',
    'Masthead Rise',
    'Modern masthead in the white top margin; hero fills the middle with a quiet bottom band.',
    'cover',
    '{ "columns": 1, "rows": ["margin-top", "hero", "margin-bottom"], "centerfold": false }'::jsonb,
    'talisbooks-cover talisbooks-cover--masthead-rise',
    '{
      "coverId": "masthead-rise",
      "titlePlacement": "top-band",
      "titleAlign": "left",
      "subtitleAlign": "left",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "hero": { "fit": "cover", "role": "hero" },
      "fields": ["title", "subtitle", "heroImage"]
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-cascade-editorial',
    'Cascade Editorial',
    'Asymmetric editorial: title in the top white margin, subtitle in the bottom white margin.',
    'cover',
    '{ "columns": 1, "rows": ["margin-top", "hero", "margin-bottom"], "centerfold": false }'::jsonb,
    'talisbooks-cover talisbooks-cover--cascade-editorial',
    '{
      "coverId": "cascade-editorial",
      "titlePlacement": "top-left-bottom-right",
      "titleAlign": "left",
      "subtitleAlign": "right",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "hero": { "fit": "cover", "role": "hero" },
      "fields": ["title", "subtitle", "heroImage"]
    }'::jsonb,
    TRUE,
    TRUE
  ),
  (
    'cover-vista-overlay',
    'Vista Overlay',
    'Lower-left title stack on the hero with white framing margins for a premium lookbook feel.',
    'cover',
    '{ "columns": 1, "rows": ["margin-top", "hero", "margin-bottom"], "centerfold": false }'::jsonb,
    'talisbooks-cover talisbooks-cover--vista-overlay',
    '{
      "coverId": "vista-overlay",
      "titlePlacement": "hero-lower-left",
      "titleAlign": "left",
      "subtitleAlign": "left",
      "margins": { "top": 0.08, "bottom": 0.08, "unit": "ratio" },
      "hero": { "fit": "cover", "role": "hero" },
      "fields": ["title", "subtitle", "heroImage"]
    }'::jsonb,
    TRUE,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  layout_type = EXCLUDED.layout_type,
  grid_config = EXCLUDED.grid_config,
  css_classes = EXCLUDED.css_classes,
  config = EXCLUDED.config,
  is_system = EXCLUDED.is_system,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
