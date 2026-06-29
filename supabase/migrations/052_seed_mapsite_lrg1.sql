-- Seed production template MapSite: lrg1 (Lydia Richard Gaertner)
DO $$
DECLARE
  ms_id UUID;
  cat_root UUID;
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM mapsites WHERE lower(fast_code) = 'lrg1';

  IF existing_id IS NOT NULL THEN
    RETURN;
  END IF;

  INSERT INTO mapsites (
    fast_code,
    slug,
    account_type,
    owner_first_name,
    owner_last_name,
    agent_name,
    email,
    phone,
    website,
    status,
    property_title,
    property_address,
    property_description,
    latitude,
    longitude,
    price,
    profile_image_url,
    logo_url,
    header_image_url,
    video_url,
    gallery_images,
    map_zoom,
    meta_title,
    meta_description,
    og_image_url
  ) VALUES (
    'lrg1',
    'LRG1',
    'Root Account™',
    'Lydia',
    'Gaertner',
    'Lydia Richard Gaertner',
    'lydia.gaertner@example.com',
    '+1 (416) 555-0142',
    'https://talispros.com',
    'active',
    'Waterfront Estate — Cape Breton Highlands',
    '123 Highland View Road',
    'A distinguished waterfront property offering panoramic ocean views, mature landscaping, and exceptional privacy. This MapSite serves as the production template for Talispros™ MapSites.',
    46.088287,
    -59.882749,
    '$1,250,000',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    '/logo.png',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=600&fit=crop',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY[
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'
    ],
    14,
    'Waterfront Estate — lrg1 | MapSite™',
    'Explore the lrg1 production MapSite template for Talispros™ — waterfront property in Cape Breton Highlands.',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=630&fit=crop'
  )
  RETURNING id INTO ms_id;

  SELECT id INTO cat_root FROM categories WHERE slug = 'root';

  IF ms_id IS NOT NULL AND cat_root IS NOT NULL THEN
    INSERT INTO pins (
      mapsite_id,
      name,
      description,
      category_id,
      latitude,
      longitude,
      address,
      city,
      province,
      postal_code,
      country,
      website,
      phone,
      email,
      featured,
      sort_order
    ) VALUES (
      ms_id,
      'Home PIN — Waterfront Estate',
      'Primary Home PIN for the lrg1 production MapSite template.',
      cat_root,
      46.088287,
      -59.882749,
      '123 Highland View Road',
      'Ingonish',
      'NS',
      'B0C 1L0',
      'Canada',
      'https://talispros.com',
      '+1 (416) 555-0142',
      'lydia.gaertner@example.com',
      TRUE,
      1
    );
  END IF;
END $$;
