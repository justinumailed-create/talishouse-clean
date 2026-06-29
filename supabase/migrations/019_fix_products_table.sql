-- Fix products table IDs and image paths
DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    -- Update IDs to match frontend PRODUCT_DEFINITIONS
    UPDATE products SET id = 'talishouse-400' WHERE id = 'talishouse-420';
    UPDATE products SET id = 'talishouse-800' WHERE id = 'talishouse-residential';

    -- Set correct image paths
    UPDATE products SET image_url = '/images/glasshouse/models/160.png' WHERE id = 'glasshouse-160';
    UPDATE products SET image_url = '/images/glasshouse/models/200.png' WHERE id = 'glasshouse-200';
    UPDATE products SET image_url = '/images/talishouse/recreational/hero.jpg' WHERE id = 'talishouse-400';
    UPDATE products SET image_url = '/images/talishouse/residential/hero.png' WHERE id = 'talishouse-800';
    UPDATE products SET image_url = '/images/talishouse/residential/hero.png' WHERE id = 'talishouse-1600';
    UPDATE products SET image_url = '/images/talistowns.jpg' WHERE id = 'talistowns';

    -- Ensure all 6 products exist with correct structure
    INSERT INTO products (id, name, category, size, price, image_url)
    VALUES 
      ('glasshouse-160', 'Glasshouse™ 160', 'Glasshouse™', '160 sq ft', 58000, '/images/glasshouse/models/160.png'),
      ('glasshouse-200', 'Glasshouse™ 200', 'Glasshouse™', '200 sq ft', 72000, '/images/glasshouse/models/200.png'),
      ('talishouse-400', 'Talishouse™ 400', 'Talishouse™ Mobile', '400 sq ft', 58000, '/images/talishouse/recreational/hero.jpg'),
      ('talishouse-800', 'Talishouse™ 800', 'Talishouse™ Residential', '800 sq ft', 98000, '/images/talishouse/residential/hero.png'),
      ('talishouse-1600', '2x Talishouse™ 800', 'Talishouse™ Residential', '1600 sq ft', 196000, '/images/talishouse/residential/hero.png'),
      ('talistowns', 'TalisTowns™ Bundle', 'TalisTowns™', '2x Talishouse™ 400', 116000, '/images/talistowns.jpg')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      size = EXCLUDED.size,
      price = COALESCE(products.price, EXCLUDED.price),
      image_url = COALESCE(NULLIF(products.image_url, ''), EXCLUDED.image_url);
  END IF;
END $$;