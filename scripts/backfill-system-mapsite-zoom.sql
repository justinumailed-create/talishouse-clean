-- NOT RUN. Optional. Every Mapsite page already opens at ~80 km unless
-- map_zoom_explicit is true, so this update is not required for the page.
-- Run only if stored mapsites.map_zoom should match that view for rows an
-- editor has not marked.
--
-- Requires supabase/migrations/120_system_mapsite_opening_zoom.sql.
-- Zoom matches systemMapsiteOpeningZoom(latitude, 900): 40 km to the nearest
-- edge of a 900 px map, Web Mercator, floored so the span still fits.

update public.mapsites
set map_zoom = least(
  21,
  greatest(
    3,
    floor(
      ln(
        (156543.03392804097 * cos(radians(latitude)))
        / (40000.0 / (900.0 / 2.0))
      ) / ln(2)
    )::int
  )
)
where latitude is not null
  and map_zoom_explicit = false;
