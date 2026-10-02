import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { BUILD_MAPSITE_PREVIEW_LOCATION } from "@/components/build-mapsite/home-pin-types";

/** Full-bleed chrome paths: homepage gate (`/`) + former homepage (`/start`). */
export function isTalisprosStartPath(pathname: string | null | undefined) {
  return (
    pathname === "/" ||
    pathname === "/start" ||
    pathname === "/talispros/start"
  );
}

/** Removed from homepage gate — kept empty so secondary disclaimer can stand alone. */
export const TALISPROS_LEGAL_PRIMARY_COPY = "";

export const TALISPROS_LEGAL_SECONDARY_COPY = "*Some limitations apply.";

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
  body: "A dedicated marketing platform covering about 50 km around all PINs you generate. Build Talisbooks™ and have us promote attached inventory.",
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

/** System Demo destination from the homepage gate. */
export const TALISPROS_HOME_SYSTEM_DEMO_HREF = "/talisu/mkts";

export type TalisprosHomeDemoPrivacyMask = {
  id: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

export type TalisprosHomeDemoStep = {
  id: string;
  step: number;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  hrefLabel?: string;
  imageSrc: string;
  imageAlt: string;
  imageObjectPosition?: string;
  privacyMask?: readonly TalisprosHomeDemoPrivacyMask[];
};

/**
 * Compact homepage demo trio (not a tall carousel).
 * Mapsite™ asset is privacy-scrubbed; CSS masks hide residual address / FAST Code.
 * Talisbooks™ slot uses a filled Demo Bookshelf composite (many books).
 */
export const TALISPROS_HOME_DEMO_FLOW: readonly TalisprosHomeDemoStep[] = [
  {
    id: "talismaps",
    step: 1,
    eyebrow: "Talismaps™",
    title: "Markets",
    body: "Claim semi-exclusive territory — pick the PIN nearest you.",
    href: "/talisu/mkts",
    hrefLabel: "/talisu/mkts",
    imageSrc: "/assets/home-demo/01-talismaps-mkts.jpg",
    imageAlt: "Talismaps™ Markets map with Canada pins (demo)",
    imageObjectPosition: "object-center",
  },
  {
    id: "talisbooks",
    step: 2,
    eyebrow: "Talisbooks™",
    title: "Demo Bookshelf",
    body: "A full Demo Bookshelf of Talisbooks™ — not a single listing hero.",
    href: "/catalogue/bookshelf",
    hrefLabel: "/catalogue/bookshelf",
    imageSrc: "/assets/home-demo/02-talisbooks-bookshelf.jpg",
    imageAlt: "Demo Bookshelf filled with many Talisbooks™ covers",
    imageObjectPosition: "object-top",
  },
  {
    id: "mapsite",
    step: 3,
    eyebrow: "Mapsites™",
    title: "Claimed Mapsite™",
    body: "Pin dashboard with URL, MLS®, TEB™, and TTV™ — identity details hidden in demo.",
    href: "/talisu/mkts",
    hrefLabel: "System Demo",
    imageSrc: "/assets/home-demo/03-claimed-mapsite-rm22.jpg",
    imageAlt: "Claimed Mapsite™ pin dashboard with address and FAST Code hidden",
    imageObjectPosition: "object-[center_35%]",
    privacyMask: [
      { id: "rail-id", left: "2%", top: "8%", width: "18%", height: "12%" },
      { id: "popup-copy", left: "38%", top: "48%", width: "28%", height: "10%" },
      { id: "pin-label", left: "40%", top: "76%", width: "24%", height: "5%" },
    ],
  },
] as const;

/** @deprecated Use TALISPROS_HOME_DEMO_FLOW — kept alias for any older imports. */
export const TALISPROS_HOME_SHOWCASE_PANELS = TALISPROS_HOME_DEMO_FLOW;
