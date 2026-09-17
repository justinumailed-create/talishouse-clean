import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { BUILD_MAPSITE_PREVIEW_LOCATION } from "@/components/build-mapsite/home-pin-types";

export function isTalisprosStartPath(pathname: string | null | undefined) {
  return pathname === "/" || pathname === "/talispros/start";
}

export const TALISPROS_LEGAL_PRIMARY_COPY =
  "Differentiate locally and develop a real estate adjacent marketing platform by using Mapsites™️ that promote qualifying inventory.*";

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
  eyebrow: "Your market",
  title: "Mapsite™",
  body: "A dedicated marketing platform covering about 50 km around all PINs you generate. Free Trial: Build Talisbooks™ and have us promote attached inventory.",
  cta: "Free Trial",
} as const;

export const TALISPROS_START_SEGMENTS = [
  {
    label: "Broker",
    title: "I am a Broker or Team Leader",
    href: `${MAPSITE_APP_PATH}?audience=brokers&accountType=root`,
  },
  {
    label: "Professional",
    title: "I am a Real Estate Professional",
    href: `${MAPSITE_APP_PATH}?audience=listings`,
  },
  {
    label: "FSBO",
    title: "I am a For-Sale-By-Owner Seller",
    href: `${MAPSITE_APP_PATH}?audience=fsbos`,
  },
  {
    label: "Adpros",
    title: "I am an Adpros Service Provider",
    href: `${MAPSITE_APP_PATH}?audience=adpro`,
  },
] as const;
