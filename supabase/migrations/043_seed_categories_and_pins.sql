-- Seed categories
INSERT INTO categories (name, slug, color, description, sort_order) VALUES
  ('Root Account™', 'root', '#F59E0B', 'Gold — market ownership, SPLITS enabled', 1),
  ('Derivative Account™', 'derivative', '#22C55E', 'Green — multi-PIN accounts, SPLITS enabled', 2),
  ('AdPro™', 'adpro', '#3B82F6', 'Blue — individual and multi-PIN packages', 3),
  ('Featured™', 'featured', '#EF4444', 'Red — premium highlighted listings', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample pins for the first mapsite in the system
DO $$
DECLARE
  ms_id UUID;
  cat_root UUID;
  cat_derivative UUID;
  cat_adpro UUID;
  cat_featured UUID;
BEGIN
  SELECT id INTO ms_id FROM mapsites LIMIT 1;
  SELECT id INTO cat_root FROM categories WHERE slug = 'root';
  SELECT id INTO cat_derivative FROM categories WHERE slug = 'derivative';
  SELECT id INTO cat_adpro FROM categories WHERE slug = 'adpro';
  SELECT id INTO cat_featured FROM categories WHERE slug = 'featured';

  IF ms_id IS NOT NULL THEN
    INSERT INTO pins (mapsite_id, name, description, category_id, latitude, longitude, address, city, province, country, featured, sort_order) VALUES
      (ms_id, 'TalisHouse™ Headquarters', 'Corporate headquarters and flagship location.', cat_root, 43.6532, -79.3832, '100 King St W', 'Toronto', 'ON', 'Canada', TRUE, 1),
      (ms_id, 'TalisHouse™ North York', 'Regional office serving the GTA north.', cat_derivative, 43.7615, -79.4111, '5100 Yonge St', 'Toronto', 'ON', 'Canada', FALSE, 2),
      (ms_id, 'TalisHouse™ Mississauga', 'Satellite office serving Peel Region.', cat_derivative, 43.5890, -79.6441, '300 City Centre Dr', 'Mississauga', 'ON', 'Canada', FALSE, 3),
      (ms_id, 'AdPro™ PIN — Downtown Core', 'Individual PIN placement in the financial district.', cat_adpro, 43.6486, -79.3803, '55 King St W', 'Toronto', 'ON', 'Canada', FALSE, 4),
      (ms_id, 'AdPro™ PIN — Liberty Village', 'PIN placement in the Liberty Village neighbourhood.', cat_adpro, 43.6370, -79.4223, '171 East Liberty St', 'Toronto', 'ON', 'Canada', FALSE, 5),
      (ms_id, 'AdPro™ PIN — Scarborough', 'PIN placement serving the Scarborough community.', cat_adpro, 43.7763, -79.2318, '300 Borough Dr', 'Toronto', 'ON', 'Canada', FALSE, 6),
      (ms_id, 'AdPro™ PIN — Etobicoke', 'PIN placement in Etobicoke.', cat_adpro, 43.6204, -79.5120, '399 The West Mall', 'Etobicoke', 'ON', 'Canada', FALSE, 7),
      (ms_id, 'Featured™ — Premium Listing', 'Premium featured property listing in Yorkville.', cat_featured, 43.6700, -79.3920, '100 Yorkville Ave', 'Toronto', 'ON', 'Canada', TRUE, 8);
  END IF;
END $$;
