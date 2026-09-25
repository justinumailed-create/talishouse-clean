import {
  ALLPINS_CANADA_DEFAULT_VIEWPORT,
} from "@/lib/talispros/allpins-mapsite-constants";
import { listAllPinsAggregatedPins } from "@/lib/talispros/allpins-mapsite";
import { MAPSITE_PIN_DEFAULT_COLOR } from "@/lib/mapsite-pin-style";
import {
  esriWorldImageryUrlWide,
  projectPinsOntoShareOg,
  type ShareOgProjectedPin,
} from "@/lib/share/og-card";

export type AllPinsOgScene = {
  latitude: number;
  longitude: number;
  zoom: number;
  imageryUrl: string;
  pinOverlays: ShareOgProjectedPin[];
  pinCount: number;
};

function viewportForPins(
  pins: Array<{ latitude: number; longitude: number }>,
): { latitude: number; longitude: number; zoom: number } {
  if (pins.length === 0) {
    return {
      latitude: ALLPINS_CANADA_DEFAULT_VIEWPORT.center.latitude,
      longitude: ALLPINS_CANADA_DEFAULT_VIEWPORT.center.longitude,
      zoom: ALLPINS_CANADA_DEFAULT_VIEWPORT.zoom,
    };
  }
  if (pins.length === 1) {
    return {
      latitude: pins[0]!.latitude,
      longitude: pins[0]!.longitude,
      zoom: 10,
    };
  }
  let minLat = pins[0]!.latitude;
  let maxLat = pins[0]!.latitude;
  let minLng = pins[0]!.longitude;
  let maxLng = pins[0]!.longitude;
  for (const pin of pins) {
    minLat = Math.min(minLat, pin.latitude);
    maxLat = Math.max(maxLat, pin.latitude);
    minLng = Math.min(minLng, pin.longitude);
    maxLng = Math.max(maxLng, pin.longitude);
  }
  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latSpan = Math.max(0.01, maxLat - minLat);
  const lngSpan = Math.max(0.01, maxLng - minLng);
  const span = Math.max(latSpan, lngSpan);
  let zoom = 3;
  if (span < 0.5) zoom = 9;
  else if (span < 2) zoom = 7;
  else if (span < 10) zoom = 5;
  else if (span < 40) zoom = 4;
  else zoom = 3;
  return { latitude, longitude, zoom };
}

/**
 * Build the ALLPINS landscape share scene: Canada satellite frame + one
 * coloured pin per live Mapsite™ (same colours as the ALLPINS map).
 */
export async function loadAllPinsOgScene(): Promise<AllPinsOgScene> {
  let pins: Awaited<ReturnType<typeof listAllPinsAggregatedPins>> = [];
  try {
    pins = await listAllPinsAggregatedPins();
  } catch (error) {
    console.warn(
      "[og] ALLPINS pin load failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const viewport = viewportForPins(pins);
  const projected = projectPinsOntoShareOg({
    pins: pins.map((pin) => ({
      latitude: pin.latitude,
      longitude: pin.longitude,
      color: pin.pinColor?.trim() || MAPSITE_PIN_DEFAULT_COLOR,
    })),
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    zoom: viewport.zoom,
    scale: 0.4,
  });

  return {
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    zoom: viewport.zoom,
    imageryUrl: esriWorldImageryUrlWide(viewport),
    pinOverlays: projected.overlays,
    pinCount: pins.length,
  };
}
