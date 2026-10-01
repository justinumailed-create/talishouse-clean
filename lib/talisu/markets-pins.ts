/**
 * TalisU™ /mkts market pins — coords & copy extracted from the live Atlist map
 * https://my.atlist.com/map/dd00462f-d929-4aac-a777-32017c2523b1 (talisu.com/mkts).
 * Rendered with first-party Talismaps™ (Google satellite), not an Atlist iframe.
 */

import type { MapEnginePin } from "@/lib/talismaps/map-engine";

export const TALISU_MKTS_ATLIST_MAP_ID =
  "dd00462f-d929-4aac-a777-32017c2523b1" as const;

/** Authentic circular Canada-flag pin from live Atlist category markerCustomIcon. */
export const TALISU_MKTS_FLAG_CA = "/talisu/mkts/atlist-canada-flag-pin.png";

/** Authentic TalisU tree logo from live Atlist "Do More..." category markerCustomIcon. */
export const TALISU_MKTS_TREE_LOGO = "/talisu/mkts/atlist-talisu-tree-pin.png";

/**
 * Source URLs (captured 2026-09-29 from Atlist AppSync categories):
 * Canada → s3://markerimages143639-prod/.../d43c09d0-5443-43c3-b0ae-a6a6ea813c18.png
 * Do More → cloudfront .../9cdfadf4-c1de-42c5-9f91-656e8e736bb7.png
 */

/** Hero image shared by Canada market pin cards (red pin on paper map). */
export const TALISU_MKTS_MARKET_HERO = "/talisu/mkts/PIN-Map-1920L.jpeg";

export const TALISU_MKTS_MODULAR_HERO = "/talisu/mkts/T-Dome-elevateNF.jpg";

/** Demo path — app/talisu/demo redirects to /talispros/demo-mapsite. */
export const TALISU_MKTS_DEMO_HREF = "/talisu/demo";

export const TALISU_MKTS_HEADER_BLUE = "#046BD9";

export const TALISU_MKTS_VIEWPORT = {
  /** Full-Canada fallback before fitBounds settles (NL→YT + Do More cluster). */
  center: { latitude: 56.2, longitude: -96.0 },
  zoom: 3.5,
} as const;

/**
 * fitBounds padding: left inset clears the floating Markets sidebar
 * (`w-[min(92vw,20.5rem)]` + left offset) so western pins stay visible.
 */
export const TALISU_MKTS_FIT_PADDING = {
  top: 64,
  right: 56,
  bottom: 64,
  left: 360,
} as const;

/**
 * fitBounds padding for chrome-free Markets preview (no Markets sidebar).
 */
export const TALISU_MKTS_START_FIT_PADDING = {
  top: 48,
  right: 48,
  bottom: 48,
  left: 48,
} as const;

/** Canada market flag pin diameter (px) on the mkts map engine. */
export const TALISU_MKTS_MARKET_PIN_SIZE = 32;

/** Do More (Modular Spaces) pin diameter — 1.5× the prior 30px size. */
export const TALISU_MKTS_DO_MORE_PIN_SIZE = 45;

export const TALISU_MKTS_FOOTER =
  "Select the PIN nearest you to claim a market of 50 miles (80 kilometres) around a centre point as semi-exclusive territory. Semi-exclusive means no other markets will be granted within that circle, but neighbouring markets will not be prevented from pinning Listings for which they have written and verified listing documentation.";

export const TALISU_MKTS_PMC_TITLE = "Talispros™ PMC";

export const TALISU_MKTS_PMC_BULLETS = [
  "Root Accounts can register unlimited Derivative Accounts.",
  "Derivative Accounts publish to Root Mapsites™ to promote up to 100 PINs each.",
  "FSBO and Adpro Accounts promote single PIN Mapsites™.",
] as const;

export const TALISU_MKTS_HEADER_TAGLINE =
  "Industry Adjacent Markets…";

/**
 * Primary top-bar links (home + claimed Mapsites™ blue header).
 * Shelf / admin places use real working routes that already exist.
 */
export const TALISU_MKTS_HEADER_NAV = [
  { href: "/talisu/mkts", label: "Markets" },
  { href: "/catalogue/bookshelf", label: "Common Shelf" },
  { href: "/talisbooks", label: "All Books" },
  { href: "/talisbooks/library", label: "FAST Shelves" },
  { href: "/catalogue/bookshelf/create", label: "Create Demo" },
  { href: "/admin/talisbooks/bookshelves", label: "Admin Places" },
  { href: "/talisu/reg", label: "Register" },
] as const;

/** TalisU™ header dropdown (Knowledge Base / Audio / Video). */
export const TALISU_MKTS_HEADER_DROPDOWN = [
  { href: "/talisu/kb", label: "Knowledge Base" },
  { href: "/talisu/au", label: "Audio" },
  { href: "/talisu/video", label: "Video" },
] as const;

export type TalisUMktsPinKind = "market" | "do-more";

export type TalisUMktsPin = {
  id: string;
  kind: TalisUMktsPinKind;
  label: string;
  latitude: number;
  longitude: number;
  mapZoom: number;
  /** Plain-text card body (HTML stripped from Atlist notes). */
  description: string;
  heroImageUrl: string | null;
  nextHref: string;
  nextLabel: string;
  /** Show as a map marker (Do More items also appear in the sidebar tree). */
  showOnMap: boolean;
  sortOrder: number;
};

/**
 * Exact lat/lng from Atlist GraphQL getMap markers (2026-09-29 export).
 * Market pins → Demo path. Do More Modular Spaces → catalogue.
 */
export const TALISU_MKTS_PINS: readonly TalisUMktsPin[] = [
  {
    id: "nl",
    kind: "market",
    label: "Newfoundland & Labrador",
    latitude: 48.9564842,
    longitude: -54.6083708,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 10,
  },
  {
    id: "ns",
    kind: "market",
    label: "Nova Scotia",
    latitude: 45.07784729999999,
    longitude: -63.5466822,
    mapZoom: 7,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 20,
  },
  {
    id: "nb-pei",
    kind: "market",
    label: "New Brunswick & PEI",
    latitude: 46.5653163,
    longitude: -66.46191639999999,
    mapZoom: 7,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 30,
  },
  {
    id: "qc",
    kind: "market",
    label: "Quebec",
    latitude: 46.8130816,
    longitude: -71.20745959999999,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 40,
  },
  {
    id: "on-east",
    kind: "market",
    label: "Eastern Ontario",
    latitude: 44.2334401,
    longitude: -76.49302949999999,
    mapZoom: 7,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 50,
  },
  {
    id: "on-south",
    kind: "market",
    label: "Southern Ontario",
    latitude: 42.9849233,
    longitude: -81.2452768,
    mapZoom: 7,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 60,
  },
  {
    id: "on-north",
    kind: "market",
    label: "Northern Ontario",
    latitude: 46.4917317,
    longitude: -80.99302899999999,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 70,
  },
  {
    id: "on-west",
    kind: "market",
    label: "Western Ontario",
    latitude: 48.3808951,
    longitude: -89.2476823,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 80,
  },
  {
    id: "mb",
    kind: "market",
    label: "Manitoba",
    latitude: 50.626293,
    longitude: -98.3987593,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 90,
  },
  {
    id: "sk",
    kind: "market",
    label: "Saskatchewan",
    latitude: 52.157902,
    longitude: -106.6701577,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 100,
  },
  {
    id: "ab",
    kind: "market",
    label: "Alberta",
    latitude: 53.5460983,
    longitude: -113.4937266,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 110,
  },
  {
    id: "bc",
    kind: "market",
    label: "British Columbia",
    latitude: 52.1416736,
    longitude: -122.1416885,
    mapZoom: 6,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 120,
  },
  {
    id: "yt",
    kind: "market",
    label: "Yukon Territory",
    latitude: 62.0876955,
    longitude: -136.2919597,
    mapZoom: 5,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 130,
  },
  {
    id: "nt",
    kind: "market",
    label: "Northwest Territories",
    latitude: 62.4539717,
    longitude: -114.3717886,
    mapZoom: 5,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 140,
  },
  {
    id: "nu",
    kind: "market",
    label: "Nunavut",
    latitude: 63.74669300000001,
    longitude: -68.5169669,
    mapZoom: 5,
    description:
      "Claim an industry adjacent market place by building a Demo Mapsite™.",
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 150,
  },
  {
    id: "modular-spaces",
    kind: "do-more",
    label: "TalisU™ Modular Spaces",
    latitude: 58.806958,
    longitude: -95.409728,
    mapZoom: 5,
    description:
      "Every registered market includes supply side access to a broad array of structures for DIY construction.",
    heroImageUrl: TALISU_MKTS_MODULAR_HERO,
    nextHref: "/catalogue",
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 220,
  },
] as const;


export function talisuMktsMapCoordinates(): { latitude: number; longitude: number }[] {
  return TALISU_MKTS_PINS.filter((pin) => pin.showOnMap).map((pin) => ({
    latitude: pin.latitude,
    longitude: pin.longitude,
  }));
}

export function talisuMktsMarketPins(): TalisUMktsPin[] {
  return TALISU_MKTS_PINS.filter((pin) => pin.kind === "market");
}

export function talisuMktsDoMorePins(): TalisUMktsPin[] {
  return TALISU_MKTS_PINS.filter((pin) => pin.kind === "do-more");
}

export function talisuMktsPinById(id: string): TalisUMktsPin | undefined {
  return TALISU_MKTS_PINS.find((pin) => pin.id === id);
}

/**
 * Shared MapEngine pin list for /talisu/mkts and the /start static preview.
 * Filters to showOnMap; market pins use CA flag, Do More uses tree logo @ 45px.
 */
export function talisuMktsToEnginePins(
  pins: readonly TalisUMktsPin[] = TALISU_MKTS_PINS,
): MapEnginePin[] {
  return pins
    .filter((pin) => pin.showOnMap)
    .map((pin) => {
      if (pin.kind === "market") {
        return {
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          color: "#FFFFFF",
          featured: false,
          metadata: {
            icon: "dot",
            whiteCenter: true,
            customLogoUrl: TALISU_MKTS_FLAG_CA,
            pinBorderColor: "#CC8800",
            pinSize: TALISU_MKTS_MARKET_PIN_SIZE,
            animated: false,
            label: pin.label,
          },
        } satisfies MapEnginePin;
      }
      return {
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        color: "#FFFFFF",
        featured: false,
        metadata: {
          icon: "dot",
          whiteCenter: true,
          customLogoUrl: TALISU_MKTS_TREE_LOGO,
          pinBorderColor: "#000000",
          pinSize: TALISU_MKTS_DO_MORE_PIN_SIZE,
          animated: false,
          label: pin.label,
        },
      } satisfies MapEnginePin;
    });
}
