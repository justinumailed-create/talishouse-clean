-- TalisMaps™ Platform Schema
-- Standalone product architecture replacing Atlist

-- ─── Maps ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  parent_map_id UUID REFERENCES talismaps_maps(id) ON DELETE SET NULL,
  mapsite_id UUID REFERENCES mapsites(id) ON DELETE SET NULL,
  fast_code TEXT,
  account_type TEXT DEFAULT 'root' CHECK (account_type IN ('root', 'derivative', 'adpro')),
  default_latitude DOUBLE PRECISION,
  default_longitude DOUBLE PRECISION,
  default_zoom INTEGER DEFAULT 12,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_maps_slug ON talismaps_maps(slug);
CREATE INDEX IF NOT EXISTS idx_talismaps_maps_account_id ON talismaps_maps(account_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_maps_parent_map_id ON talismaps_maps(parent_map_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_maps_mapsite_id ON talismaps_maps(mapsite_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_maps_fast_code ON talismaps_maps(fast_code);
CREATE INDEX IF NOT EXISTS idx_talismaps_maps_status ON talismaps_maps(status);

-- ─── Pin Categories ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_pin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (map_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_talismaps_pin_categories_map_id ON talismaps_pin_categories(map_id);

-- ─── Map Pins ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  category_id UUID REFERENCES talismaps_pin_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
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
  pin_type TEXT DEFAULT 'standard' CHECK (pin_type IN ('standard', 'property', 'adpro', 'featured')),
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_map_id ON talismaps_map_pins(map_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_category_id ON talismaps_map_pins(category_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_pins_featured ON talismaps_map_pins(featured);

-- ─── Pin Media ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_pin_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES talismaps_map_pins(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'document')),
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_pin_media_pin_id ON talismaps_pin_media(pin_id);

-- ─── Map Themes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  primary_color TEXT DEFAULT '#111827',
  accent_color TEXT DEFAULT '#3B82F6',
  pin_style TEXT DEFAULT 'default',
  map_style TEXT DEFAULT 'light',
  custom_css TEXT DEFAULT '',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_themes_map_id ON talismaps_map_themes(map_id);

-- ─── Map Views (saved viewports) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  zoom INTEGER NOT NULL DEFAULT 12,
  bearing DOUBLE PRECISION DEFAULT 0,
  pitch DOUBLE PRECISION DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_views_map_id ON talismaps_map_views(map_id);

-- ─── Map Analytics ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'pin_click', 'search', 'qr_scan', 'share', 'export')),
  pin_id UUID REFERENCES talismaps_map_pins(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_analytics_map_id ON talismaps_map_analytics(map_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_analytics_event_type ON talismaps_map_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_analytics_recorded_at ON talismaps_map_analytics(recorded_at);

-- ─── Map Permissions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  granted_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (map_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_permissions_map_id ON talismaps_map_permissions(map_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_permissions_account_id ON talismaps_map_permissions(account_id);

-- ─── Map Assets ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'icon', 'logo', 'overlay', 'template')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_assets_map_id ON talismaps_map_assets(map_id);

-- ─── Map Invitations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talismaps_map_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL REFERENCES talismaps_maps(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talismaps_map_invitations_map_id ON talismaps_map_invitations(map_id);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_invitations_token ON talismaps_map_invitations(token);
CREATE INDEX IF NOT EXISTS idx_talismaps_map_invitations_email ON talismaps_map_invitations(email);

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE talismaps_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_pin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_pin_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE talismaps_map_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published talismaps maps" ON talismaps_maps
  FOR SELECT TO public USING (is_public = TRUE AND status = 'published');

CREATE POLICY "Authenticated users can manage talismaps maps" ON talismaps_maps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps maps" ON talismaps_maps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talismaps pin categories" ON talismaps_pin_categories
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talismaps pin categories" ON talismaps_pin_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps pin categories" ON talismaps_pin_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talismaps map pins" ON talismaps_map_pins
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talismaps map pins" ON talismaps_map_pins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps map pins" ON talismaps_map_pins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talismaps pin media" ON talismaps_pin_media
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talismaps pin media" ON talismaps_pin_media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps pin media" ON talismaps_pin_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talismaps map themes" ON talismaps_map_themes
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talismaps map themes" ON talismaps_map_themes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps map themes" ON talismaps_map_themes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talismaps map views" ON talismaps_map_views
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talismaps map views" ON talismaps_map_views
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps map views" ON talismaps_map_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert talismaps analytics" ON talismaps_map_analytics
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talismaps analytics" ON talismaps_map_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps analytics" ON talismaps_map_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talismaps permissions" ON talismaps_map_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps permissions" ON talismaps_map_permissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talismaps assets" ON talismaps_map_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps assets" ON talismaps_map_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talismaps invitations" ON talismaps_map_invitations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talismaps invitations" ON talismaps_map_invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
