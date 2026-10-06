-- Owner Dashboard customizations for paid / claimed FAST-code Mapsites™.
-- Additive only: a side table keyed by mapsite, so mapsites.logo_url (the
-- original Build logo) is never overwritten. Reset = clear the override.
--
--   logo_url           Logo & Image Editor: replaces the left-card agency logo.
--   partner_image_url  Logo & Image Editor: replaces the left-card partner photo.
--   bookshelf_order    Bookshelf Editor: ordered talisbooks_books.id list for
--                      this FAST Code shelf (unknown / new ids fall to the end).
--
-- Written only by server actions with the service role after
-- requireMapSiteEditAccess (owner + paid, or admin). No public policies.

CREATE TABLE IF NOT EXISTS mapsite_owner_customizations (
  mapsite_id uuid PRIMARY KEY REFERENCES mapsites(id) ON DELETE CASCADE,
  fast_code text NOT NULL,
  logo_url text,
  partner_image_url text,
  bookshelf_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mapsite_owner_customizations_order_is_array
    CHECK (jsonb_typeof(bookshelf_order) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_mapsite_owner_customizations_fast_code
  ON mapsite_owner_customizations (lower(fast_code));

ALTER TABLE mapsite_owner_customizations ENABLE ROW LEVEL SECURITY;
