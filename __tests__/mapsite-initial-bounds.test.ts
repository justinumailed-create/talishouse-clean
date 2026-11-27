import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAPSITE_FIT_CARD_GAP_PX,
  MAPSITE_FIT_EDGE_PAD_PX,
  MAPSITE_FIT_MAX_ZOOM,
  MAPSITE_FIT_MIN_SIZE_PX,
  MAPSITE_FIT_MIN_ZOOM,
  MAPSITE_PIN_BUFFER_KM,
  bufferedPinBounds,
  mapsiteInitialFitPadding,
  projectMapsitePinToScreen,
  shouldApplyMapsiteOpeningFit,
  viewportForMapsitePins,
} from "../lib/talispros/mapsite-initial-bounds";
import { systemMapsiteOpeningZoom } from "../lib/talispros/system-mapsite-zoom";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/** Ralf Meyer RM22 pins spread across Cape Breton (Sydney, Bras d'Or, St. Peter's). */
const RM22_PINS = [
  { id: "sydney", latitude: 46.1368, longitude: -60.1831 },
  { id: "bras-dor", latitude: 45.95, longitude: -60.75 },
  { id: "st-peters", latitude: 45.66, longitude: -60.88 },
] as const;

const DESKTOP = { mapWidth: 1440, mapHeight: 820 };

describe("mapsite initial auto-fit bounds", () => {
  it("fits RM22's three Cape Breton pins on desktop, unclustered and clear of the left card", () => {
    const padding = mapsiteInitialFitPadding(DESKTOP);
    expect(padding.left).toBeGreaterThan(MAPSITE_FIT_EDGE_PAD_PX + 300);
    const view = viewportForMapsitePins({
      pins: RM22_PINS,
      fallbackCenter: { latitude: 46.1368, longitude: -60.1831 },
      ...DESKTOP,
      padding,
    });
    expect(view.mode).toBe("multi");
    expect(view.zoom).toBeGreaterThanOrEqual(MAPSITE_FIT_MIN_ZOOM);
    expect(view.zoom).toBeLessThanOrEqual(MAPSITE_FIT_MAX_ZOOM);
    // Wide enough to include all three sites, tight enough that they stay unclustered.
    expect(view.zoom).toBeGreaterThanOrEqual(7);
    expect(view.zoom).toBeLessThanOrEqual(11);

    const screens = RM22_PINS.map((pin) =>
      projectMapsitePinToScreen(
        pin,
        view.center,
        view.zoom,
        DESKTOP.mapWidth,
        DESKTOP.mapHeight,
      ),
    );
    for (const point of screens) {
      expect(point.x).toBeGreaterThan(padding.left);
      expect(point.x).toBeLessThan(DESKTOP.mapWidth - padding.right);
      expect(point.y).toBeGreaterThan(padding.top);
      expect(point.y).toBeLessThan(DESKTOP.mapHeight - padding.bottom);
    }
    const distances: number[] = [];
    for (let i = 0; i < screens.length; i += 1) {
      for (let j = i + 1; j < screens.length; j += 1) {
        const dx = screens[i]!.x - screens[j]!.x;
        const dy = screens[i]!.y - screens[j]!.y;
        distances.push(Math.hypot(dx, dy));
      }
    }
    expect(Math.min(...distances)).toBeGreaterThan(80);
  });

  it("uses the 80 km opening zoom for a single pin instead of max-zooming", () => {
    const pin = { latitude: 46.1368, longitude: -60.1831 };
    const view = viewportForMapsitePins({
      pins: [pin],
      fallbackCenter: pin,
      ...DESKTOP,
    });
    expect(view.mode).toBe("single");
    expect(view.center).toEqual(pin);
    expect(view.zoom).toBe(
      systemMapsiteOpeningZoom(pin.latitude, Math.min(DESKTOP.mapWidth, DESKTOP.mapHeight)),
    );
    expect(view.zoom).toBeGreaterThanOrEqual(8);
    expect(view.zoom).toBeLessThanOrEqual(11);
    expect(view.zoom).toBeLessThan(MAPSITE_FIT_MAX_ZOOM);
  });

  it("honors a saved editor zoom on a single pin", () => {
    const pin = { latitude: 43.65, longitude: -79.38 };
    const view = viewportForMapsitePins({
      pins: [pin],
      fallbackCenter: pin,
      ...DESKTOP,
      singlePinZoom: 16,
    });
    expect(view.mode).toBe("single");
    expect(view.zoom).toBe(16);
  });

  it("falls back to the default region when there are no pins", () => {
    const fallback = { latitude: 46.25, longitude: -60.5 };
    const view = viewportForMapsitePins({
      pins: [],
      fallbackCenter: fallback,
      ...DESKTOP,
    });
    expect(view.mode).toBe("empty");
    expect(view.center).toEqual(fallback);
    expect(view.zoom).toBe(
      systemMapsiteOpeningZoom(
        fallback.latitude,
        Math.min(DESKTOP.mapWidth, DESKTOP.mapHeight),
      ),
    );
  });

  it("ignores invalid coordinates and still fits the remaining pins", () => {
    const view = viewportForMapsitePins({
      pins: [
        { latitude: Number.NaN, longitude: -60.2 },
        ...RM22_PINS,
        { latitude: 45.7, longitude: Number.POSITIVE_INFINITY },
      ],
      fallbackCenter: { latitude: 46, longitude: -60 },
      ...DESKTOP,
    });
    expect(view.mode).toBe("multi");
  });

  it("keeps a tight pair of pins at or below the neighborhood zoom cap", () => {
    const view = viewportForMapsitePins({
      pins: [
        { latitude: 46.1368, longitude: -60.1831 },
        { latitude: 46.1372, longitude: -60.1825 },
      ],
      fallbackCenter: { latitude: 46.1368, longitude: -60.1831 },
      ...DESKTOP,
    });
    expect(view.mode).toBe("multi");
    expect(view.zoom).toBeLessThanOrEqual(MAPSITE_FIT_MAX_ZOOM);
  });

  it("uses top padding on compact layouts instead of the desktop left card inset", () => {
    const compact = mapsiteInitialFitPadding({ mapWidth: 390, mapHeight: 720 });
    const desktop = mapsiteInitialFitPadding(DESKTOP);
    expect(compact.left).toBeLessThan(desktop.left);
    expect(compact.top).toBeGreaterThan(desktop.top);
  });

  it("waits until the map is ready and sized, and does not fight a user pan or zoom", () => {
    const ready = {
      isReady: true,
      mapWidth: 1440,
      mapHeight: 820,
      pinEditorIdle: true,
      openPinOnLoad: false,
      userMovedMap: false,
    };
    expect(shouldApplyMapsiteOpeningFit(ready)).toBe(true);
    expect(
      shouldApplyMapsiteOpeningFit({
        ...ready,
        mapWidth: MAPSITE_FIT_MIN_SIZE_PX,
        mapHeight: MAPSITE_FIT_MIN_SIZE_PX,
      }),
    ).toBe(false);
    expect(shouldApplyMapsiteOpeningFit({ ...ready, isReady: false })).toBe(false);
    expect(shouldApplyMapsiteOpeningFit({ ...ready, pinEditorIdle: false })).toBe(false);
    expect(shouldApplyMapsiteOpeningFit({ ...ready, openPinOnLoad: true })).toBe(false);
    expect(shouldApplyMapsiteOpeningFit({ ...ready, userMovedMap: true })).toBe(false);
    expect(shouldApplyMapsiteOpeningFit({ ...ready, selectedPinId: "pin-2" })).toBe(
      false,
    );
  });

  it("still exports the 32 km geographic buffer helper", () => {
    expect(MAPSITE_PIN_BUFFER_KM).toBe(32);
    const corners = bufferedPinBounds(RM22_PINS);
    expect(corners).toHaveLength(2);
    expect(corners[0]!.latitude).toBeLessThan(45.66);
    expect(corners[1]!.latitude).toBeGreaterThan(46.1368);
  });

  it("wires auto-fit into the Mapsite page and does not re-fit after a user gesture", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("viewportForMapsitePins");
    expect(app).toContain("shouldApplyMapsiteOpeningFit");
    expect(app).toContain("mapsiteInitialFitPadding");
    expect(app).toContain("userMovedMapRef");
    expect(app).toContain("data-map-opening={mapOpening}");
    expect(MAPSITE_FIT_EDGE_PAD_PX).toBeGreaterThan(0);
    expect(MAPSITE_FIT_CARD_GAP_PX).toBeGreaterThan(0);
  });
});
