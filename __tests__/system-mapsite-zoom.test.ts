import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { zoomForMapRadiusKm } from "../lib/talispros/start-content";
import {
  SYSTEM_MAPSITE_FALLBACK_PX,
  SYSTEM_MAPSITE_RADIUS_KM,
  SYSTEM_MAPSITE_SPAN_KM,
  systemMapsiteOpeningZoom,
} from "../lib/talispros/system-mapsite-zoom";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("system-built Mapsite opening zoom", () => {
  it("frames about 80 km around the pin", () => {
    expect(SYSTEM_MAPSITE_SPAN_KM).toBe(80);
    expect(SYSTEM_MAPSITE_RADIUS_KM).toBe(40);
    const zoom = systemMapsiteOpeningZoom(46.2507, 900);
    expect(zoom).toBe(zoomForMapRadiusKm(46.2507, 40, 900));
    expect(zoom).toBeGreaterThanOrEqual(8);
    expect(zoom).toBeLessThanOrEqual(11);
    expect(systemMapsiteOpeningZoom(46.2507)).toBe(
      systemMapsiteOpeningZoom(46.2507, SYSTEM_MAPSITE_FALLBACK_PX),
    );
  });

  it("uses that zoom for every Mapsite and keeps an editor zoom", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    const page = read("app/talispros/mapsite/[accountType]/[fastCode]/page.tsx");
    const queryPage = read("app/talispros/mapsite/page.tsx");
    const reader = read("lib/talispros/system-mapsite-zoom-server.ts");
    expect(page).toContain("mapZoomExplicit={await readMapZoomExplicit(mapsite.id)}");
    expect(queryPage).toContain("readMapZoomExplicit");
    expect(app).not.toContain("systemBuilt");
    expect(app).toContain("const useOpeningZoom = !mapZoomExplicit");
    expect(app).toContain("useOpeningZoom ? systemMapsiteOpeningZoom(mapsite.lat) : mapsite.map_zoom");
    expect(app).not.toContain("fitAllFastCodePins");
    expect(app).toContain('data-map-opening={useOpeningZoom ? "80km" : "saved"}');
    expect(reader).toContain("application/openapi+json");
    expect(reader).toContain("if (!mapsiteId || !(await explicitColumnReady())) return false");
    const job = read("lib/talispros/fast-code-daily-job.ts");
    expect(job).toContain("systemMapsiteOpeningZoom");
    expect(job).toContain("opening_zoom");
    expect(job).toContain("saveSystemMapsiteOpeningZoom");
    const migration = read("supabase/migrations/120_system_mapsite_opening_zoom.sql");
    expect(migration).toContain("map_zoom_explicit");
    expect(migration).not.toMatch(/update\s+public\.mapsites/i);
    const backfill = read("scripts/backfill-system-mapsite-zoom.sql");
    expect(backfill).toContain("NOT RUN");
    expect(backfill).toContain("map_zoom_explicit = false");
    expect(backfill).not.toContain("agent_fast_code_slots");
  });
});
