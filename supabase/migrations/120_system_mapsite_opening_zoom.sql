-- Every Mapsite opens at ~80 km unless an editor saved a zoom.
-- This file only adds the flags. It does not rewrite existing map_zoom values.
-- Do not apply the companion script scripts/backfill-system-mapsite-zoom.sql
-- unless the stored zoom should match the opening view. The page does not need it.

alter table public.mapsites
  add column if not exists map_zoom_explicit boolean not null default false;

comment on column public.mapsites.map_zoom_explicit is
  'True when an editor saved map_zoom. Every Mapsite otherwise opens at an 80 km span.';

alter table public.prospect_queue
  add column if not exists opening_zoom integer;

comment on column public.prospect_queue.opening_zoom is
  'Zoom for an 80 km span around the sourced pin. Copied onto the Mapsite when that code is built.';
