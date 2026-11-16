-- Optional contact name on a Mapsite personal home page.
-- Empty means the page shows the owner name. Not applied in this change.

alter table public.mapsite_personal_home
  add column if not exists contact_name text;
