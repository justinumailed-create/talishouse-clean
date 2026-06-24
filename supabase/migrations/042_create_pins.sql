-- Create pins table for TalisMaps™ map markers
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapsite_id UUID NOT NULL REFERENCES mapsites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id UUID REFERENCES categories(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  province TEXT DEFAULT '',
  postal_code TEXT DEFAULT '',
  country TEXT DEFAULT '',
  website TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view pins" ON pins
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage pins" ON pins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pins_mapsite_id ON pins(mapsite_id);
CREATE INDEX IF NOT EXISTS idx_pins_category_id ON pins(category_id);
CREATE INDEX IF NOT EXISTS idx_pins_featured ON pins(featured);
CREATE INDEX IF NOT EXISTS idx_pins_sort_order ON pins(sort_order);
