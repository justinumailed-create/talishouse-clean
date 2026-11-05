-- NOT RUN. Optional. The Mapsite page already opens system-built pins at ~80 km
-- without this update. Run only if stored mapsites.map_zoom should match that view
-- for rows an editor has not marked (map_zoom_explicit stays false).
--
-- Requires supabase/migrations/120_system_mapsite_opening_zoom.sql.
-- Zoom matches systemMapsiteOpeningZoom(latitude, 900): 40 km to the nearest
-- edge of a 900 px map, Web Mercator, floored so the span still fits.

update public.mapsites m
set map_zoom = least(
  21,
  greatest(
    3,
    floor(
      ln(
        (156543.03392804097 * cos(radians(m.latitude)))
        / (40000.0 / (900.0 / 2.0))
      ) / ln(2)
    )::int
  )
)
from public.agent_fast_code_slots s
where s.mapsite_id = m.id
  and m.latitude is not null
  and m.map_zoom_explicit = false;
