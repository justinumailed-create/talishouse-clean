-- Public TalisBooks™ bookshelf: at most one pinned / featured book.
ALTER TABLE talisbooks_books
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN talisbooks_books.is_pinned IS
  'When true, this book is featured first on the public /talisbooks bookshelf. Only one row may be pinned.';

CREATE UNIQUE INDEX IF NOT EXISTS talisbooks_books_one_pinned_idx
  ON talisbooks_books (is_pinned)
  WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS talisbooks_books_public_shelf_idx
  ON talisbooks_books (is_pinned DESC, published_at DESC NULLS LAST)
  WHERE is_public = TRUE AND publish_status = 'published';
