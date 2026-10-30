-- Personal home page shown before a root account holder's Mapsite
-- (/talispros/home/<code>). One row per Mapsite / FAST Code. Every column is
-- optional: an empty value falls back to the default built from the Mapsite
-- record (owner name, photo, description), so existing Mapsites need no row.
--
--   image_url   Owner photo (Supabase Storage public URL only).
--   kicker      Small line above the headline.
--   headline    Main heading (default: owner / agent name).
--   write_up    Body text.
--   buttons     Ordered [{ "label": text, "href": url }] (empty = defaults).
--
-- Written only by server actions with the service role after the owner
-- session / Mapsite admin check. No public policies.

CREATE TABLE IF NOT EXISTS mapsite_personal_home (
  mapsite_id uuid PRIMARY KEY REFERENCES mapsites(id) ON DELETE CASCADE,
  fast_code text NOT NULL,
  image_url text,
  kicker text,
  headline text,
  write_up text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mapsite_personal_home_buttons_is_array
    CHECK (jsonb_typeof(buttons) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_mapsite_personal_home_fast_code
  ON mapsite_personal_home (lower(fast_code));

ALTER TABLE mapsite_personal_home ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE mapsite_personal_home FROM anon, authenticated;
