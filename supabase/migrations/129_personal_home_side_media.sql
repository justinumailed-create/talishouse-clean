-- Left-side media on a personal home page.
-- Null means the page keeps using image_url (the top-button photo) or the Mapsite photo.
-- Shape: { "kind": "image" | "video" | "embed", "url": "https://..." }
-- Not applied in this change. Arun must approve before this is run.

alter table public.mapsite_personal_home
  add column if not exists side_media jsonb;
