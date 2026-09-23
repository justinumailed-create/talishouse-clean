import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { BUILD_MAPSITE_PREVIEW_LOCATION } from "@/components/build-mapsite/home-pin-types";

export function isTalisprosStartPath(pathname: string | null | undefined) {
  return pathname === "/" || pathname === "/talispros/start";
}

export const TALISPROS_LEGAL_PRIMARY_COPY =
  "More traffic in higher gross markets for better averages over time.";

export const TALISPROS_LEGAL_SECONDARY_COPY = "*Some Limitations apply";

/** Same default Home PIN as Claim a Market / Build A Mapsite™. */
export const TALISPROS_HOME_MAP_FALLBACK = {
  latitude: BUILD_MAPSITE_PREVIEW_LOCATION.latitude,
  longitude: BUILD_MAPSITE_PREVIEW_LOCATION.longitude,
} as const;

/** Market area shown on the homepage Mapsite™ preview. */
export const TALISPROS_HOME_MAP_RADIUS_KM = 50;

/**
 * Web Mercator zoom so `radiusKm` fits from the pin to the nearest map edge.
 * Uses the shorter viewport side so a circular 50 km market stays on screen.
 */
export function zoomForMapRadiusKm(
  latitude: number,
  radiusKm: number,
  minViewportPx: number,
): number {
  const safeRadius = Math.max(1, radiusKm);
  const safeSpan = Math.max(64, minViewportPx);
  const latRad = (Math.max(-85, Math.min(85, latitude)) * Math.PI) / 180;
  const metersPerPixel =
    (safeRadius * 1000) / (safeSpan / 2);
  const zoom = Math.log2(
    (156543.03392804097 * Math.cos(latRad)) / metersPerPixel,
  );
  if (!Number.isFinite(zoom)) return 9;
  // Floor so the 50 km circle always fits; Google Maps integer-rounds 9.5 to 10 (~35 km).
  return Math.min(21, Math.max(3, Math.floor(zoom)));
}

export const TALISPROS_HOME_MAPSITE_CARD = {
  title: "Build Mapsite™",
  body: "A dedicated marketing platform covering about 50 km around all PINs you generate. Free Demo: Build Talisbooks™ and have us promote attached inventory.",
  cta: "Free Demo",
} as const;

export const TALISPROS_START_SEGMENTS = [
  {
    label: "Owners / Managers",
    title: "Broker or Team Leader",
    href: `${MAPSITE_APP_PATH}?audience=brokers&accountType=root`,
  },
  {
    label: "Licensed",
    title: "Real Estate Professional",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
  },
  {
    label: "Unlicensed",
    title: "For-Sale-By-Owner",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
  },
  {
    label: "Adpro™",
    title: "Product & Service Providers",
    href: `${MAPSITE_APP_PATH}?audience=adpro`,
  },
] as const;
