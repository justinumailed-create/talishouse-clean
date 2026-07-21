-- TalisBooks™ Platform Schema
-- Standalone digital book / lookbook engine (no MapSites integration yet)

-- ─── Authors ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_authors_slug ON talisbooks_authors(slug);
CREATE INDEX IF NOT EXISTS idx_talisbooks_authors_account_id ON talisbooks_authors(account_id);

-- ─── Templates ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_type TEXT NOT NULL DEFAULT 'book'
    CHECK (template_type IN ('book', 'page', 'cover', 'section', 'spread')),
  preview_url TEXT DEFAULT '',
  config JSONB DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_templates_slug ON talisbooks_templates(slug);
CREATE INDEX IF NOT EXISTS idx_talisbooks_templates_type ON talisbooks_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_talisbooks_templates_active ON talisbooks_templates(is_active);

-- ─── Layouts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  layout_type TEXT NOT NULL DEFAULT 'single'
    CHECK (layout_type IN ('cover', 'single', 'spread', 'gallery', 'custom')),
  grid_config JSONB DEFAULT '{}'::jsonb,
  css_classes TEXT DEFAULT '',
  config JSONB DEFAULT '{}'::jsonb,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_layouts_slug ON talisbooks_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_talisbooks_layouts_type ON talisbooks_layouts(layout_type);
CREATE INDEX IF NOT EXISTS idx_talisbooks_layouts_active ON talisbooks_layouts(is_active);

-- ─── Images ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES talisbooks_authors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  width INTEGER,
  height INTEGER,
  mime_type TEXT DEFAULT '',
  file_size INTEGER,
  storage_path TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_images_author_id ON talisbooks_images(author_id);

-- ─── Books ──────────────────────────────────────────────────────────────────
-- publish_status is the PublishStatus domain field (future-ready workflow)

CREATE TABLE IF NOT EXISTS talisbooks_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  publish_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'in_review', 'scheduled', 'published', 'archived', 'withdrawn')),
  author_id UUID REFERENCES talisbooks_authors(id) ON DELETE SET NULL,
  template_id UUID REFERENCES talisbooks_templates(id) ON DELETE SET NULL,
  cover_image_id UUID REFERENCES talisbooks_images(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  locale TEXT DEFAULT 'en-CA',
  page_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_books_slug ON talisbooks_books(slug);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_publish_status ON talisbooks_books(publish_status);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_author_id ON talisbooks_books(author_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_template_id ON talisbooks_books(template_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_books_account_id ON talisbooks_books(account_id);

-- Optional book ownership on images (added after books exist)
ALTER TABLE talisbooks_images
  ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES talisbooks_books(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_talisbooks_images_book_id ON talisbooks_images(book_id);

-- ─── Book Pages ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talisbooks_book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  layout_id UUID REFERENCES talisbooks_layouts(id) ON DELETE SET NULL,
  template_id UUID REFERENCES talisbooks_templates(id) ON DELETE SET NULL,
  title TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  page_number INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}'::jsonb,
  background_image_id UUID REFERENCES talisbooks_images(id) ON DELETE SET NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (book_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_book_pages_book_id ON talisbooks_book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_pages_layout_id ON talisbooks_book_pages(layout_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_book_pages_sort_order ON talisbooks_book_pages(book_id, sort_order);

-- ─── Publish Status Events (PublishStatus audit / future workflows) ─────────

CREATE TABLE IF NOT EXISTS talisbooks_publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES talisbooks_books(id) ON DELETE CASCADE,
  from_status TEXT
    CHECK (from_status IS NULL OR from_status IN ('draft', 'in_review', 'scheduled', 'published', 'archived', 'withdrawn')),
  to_status TEXT NOT NULL
    CHECK (to_status IN ('draft', 'in_review', 'scheduled', 'published', 'archived', 'withdrawn')),
  note TEXT DEFAULT '',
  changed_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talisbooks_publish_events_book_id ON talisbooks_publish_events(book_id);
CREATE INDEX IF NOT EXISTS idx_talisbooks_publish_events_to_status ON talisbooks_publish_events(to_status);
CREATE INDEX IF NOT EXISTS idx_talisbooks_publish_events_created_at ON talisbooks_publish_events(created_at);

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE talisbooks_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE talisbooks_publish_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published talisbooks books" ON talisbooks_books
  FOR SELECT TO public USING (is_public = TRUE AND publish_status = 'published');

CREATE POLICY "Authenticated users can manage talisbooks books" ON talisbooks_books
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks books" ON talisbooks_books
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks book pages" ON talisbooks_book_pages
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks book pages" ON talisbooks_book_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks book pages" ON talisbooks_book_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view active talisbooks templates" ON talisbooks_templates
  FOR SELECT TO public USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage talisbooks templates" ON talisbooks_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks templates" ON talisbooks_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view active talisbooks layouts" ON talisbooks_layouts
  FOR SELECT TO public USING (is_active = TRUE);

CREATE POLICY "Authenticated users can manage talisbooks layouts" ON talisbooks_layouts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks layouts" ON talisbooks_layouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks images" ON talisbooks_images
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks images" ON talisbooks_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks images" ON talisbooks_images
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view talisbooks authors" ON talisbooks_authors
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can manage talisbooks authors" ON talisbooks_authors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks authors" ON talisbooks_authors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage talisbooks publish events" ON talisbooks_publish_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage talisbooks publish events" ON talisbooks_publish_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
