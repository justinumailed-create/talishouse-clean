-- Per-Mapsite dashboard view. Default on, so current Mapsites keep the dashboard.
-- Not applied to production by this change. Apply it before the admin toggle can save.

alter table public.mapsites
  add column if not exists dashboard_view_enabled boolean not null default true;
