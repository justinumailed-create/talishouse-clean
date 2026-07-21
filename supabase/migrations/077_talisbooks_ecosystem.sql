-- TalisBooks™ Ecosystem Schema
-- Extends the platform with MapSite™, Account, and FAST Code relationships
-- plus publication engine tables for media, assets, themes, analytics, versions, settings.

-- ─── Books: ecosystem links (mirrors TalisMaps™ maps) ───────────────────────

ALTER TABLE talisbooks_books
  ADD COLUMN IF NOT EXISTS mapsite_id UUID REFERENCES mapsites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fast_code TEXT,
  ADD COLUMN IF NOT EXISTS parent_book_id UUID REFERENCES talisbooks_books(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'root'
    CHECK (account_type IN ('root', 'derivative', 'adpro'));

CREATE INDEX IF NOT EXISTS idx_talisbooks_books_mapsite_id ON talisbooks_books(mapsite_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_fast_code ON talisbooks_books(fast_code);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_parent_book_id ON talisbooks_books(parent_book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_account_type ON talisbooks_books(account_type);

-- ─── Book Media ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  page_id UUID REFERENCES talisbooks_book_pages(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  width INTEGER,
  height INTEGER,
  mime_type TEXT DEFAULT '',
  file_size INTEGER,
  storage_path TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_media_book_id ON talisbooks_book_media(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_media_page_id ON talisbooks_book_media(page_id);

-- ─── Book Assets ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'image'
    CHECK (asset_type IN ('image', 'icon', 'logo', 'font', 'overlay', 'template', 'export')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_assets_book_id ON talisbooks_book_assets(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_assets_type ON talisbooks_book_assets(asset_type);

-- ─── Book Themes ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  primary_color TEXT DEFAULT '#111827',
  accent_color TEXT DEFAULT '#3B82F6',
  typography_scale TEXT DEFAULT 'default',
  page_style TEXT DEFAULT 'light',
  custom_css TEXT DEFAULT '',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_themes_book_id ON talisbooks_book_themes(book_id);

-- ─── Book Analytics ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  page_id UUID REFERENCES talisbooks_book_pages(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('view', 'page_turn', 'page_view', 'share', 'export', 'qr_scan', 'audio_play')),
  session_id TEXT,
  referrer TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_analytics_book_id ON talisbooks_book_analytics(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_analytics_event_type ON talisbooks_book_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_analytics_recorded_at ON talisbooks_book_analytics(recorded_at);

-- ─── Book Versions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  label TEXT DEFAULT '',
  snapshot JSONB DEFAULT '{}'::jsonb,
  publish_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'in_review', 'scheduled', 'published', 'archived', 'withdrawn')),
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (book_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_versions_book_id ON talisbooks_book_versions(book_id);

-- ─── Book Settings (per-book + platform singleton) ──────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  book_id UUID REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'book' CHECK (scope IN ('book', 'platform')),
  viewer_auto_turn_ms INTEGER DEFAULT 4500,
  viewer_pause_on_hover BOOLEAN DEFAULT TRUE,
  narration_enabled BOOLEAN DEFAULT FALSE,
  default_locale TEXT DEFAULT 'en-CA',
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (book_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_settings_book_id ON talisbooks_book_settings(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_settings_scope ON talisbooks_book_settings(scope);

INSERT INTO talisbooks_book_settings (id, book_id, scope, config)
VALUES ('platform-global', NULL, 'platform', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE talisbooks_book_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view talisbooks book media" ON talisbooks_book_media
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks book media" ON talisbooks_book_media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book media" ON talisbooks_book_media
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks book assets" ON talisbooks_book_assets
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks book assets" ON talisbooks_book_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book assets" ON talisbooks_book_assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks book themes" ON talisbooks_book_themes
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks book themes" ON talisbooks_book_themes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book themes" ON talisbooks_book_themes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert talisbooks book analytics" ON talisbooks_book_analytics
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talisbooks book analytics" ON talisbooks_book_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book analytics" ON talisbooks_book_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talisbooks book versions" ON talisbooks_book_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book versions" ON talisbooks_book_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks book settings" ON talisbooks_book_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks book settings" ON talisbooks_book_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book settings" ON talisbooks_book_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);
