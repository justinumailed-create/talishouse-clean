/**
 * TalisU™ /mkts market pins — coords & copy extracted from the live Atlist map
 * https://my.atlist.com/map/dd00462f-d929-4aac-a777-32017c2523b1 (talisu.com/mkts).
 * Rendered with first-party Talismaps™ (Google satellite), not an Atlist iframe.
 */

export const TALISU_MKTS_ATLIST_MAP_ID =
  "dd00462f-d929-4aac-a777-32017c2523b1" as const;

export const TALISU_MKTS_FLAG_CA = "/flags/ca.svg";

/** Hero image shared by Canada market pin cards (red pin on paper map). */
export const TALISU_MKTS_MARKET_HERO = "/talisu/mkts/PIN-Map-1920L.jpeg";

export const TALISU_MKTS_MODULAR_HERO = "/talisu/mkts/T-Dome-elevateNF.jpg";

/** Demo path — app/talisu/demo redirects to /talispros/demo-mapsite. */
export const TALISU_MKTS_DEMO_HREF = "/talisu/demo";

export const TALISU_MKTS_HEADER_BLUE = "#0069CF";

export const TALISU_MKTS_VIEWPORT = {
  /** Eastern / Atlantic Canada framing to match live Atlist screenshots. */
  center: { latitude: 48.2, longitude: -72.5 },
  zoom: 4.6,
} as const;

export const TALISU_MKTS_FOOTER =
  "Select the PIN nearest you to claim a market of 50 miles (80 kilometres) around a centre point as semi-exclusive territory. Semi-exclusive means no other markets will be granted within that circle, but neighbouring markets will not be prevented from pinning Listings for which they have written and verified listing documentation.";

export const TALISU_MKTS_PMC_TITLE = "Talispros™ PMC";

export const TALISU_MKTS_PMC_BULLETS = [
  "Root Accounts can register unlimited Derivative Accounts.",
  "Derivative Accounts publish to Root Mapsites™ to promote up to 100 PINs.",
  "FSBO and Adpro Accounts promote single PIN Mapsites™.",
] as const;

export const TALISU_MKTS_HEADER_TAGLINE =
  "Semi-Exclusive Proprietary Markets…";

export const TALISU_MKTS_HEADER_NAV = [
  { href: "/talisu/mkts", label: "Markets" },
  { href: "/talisu/eb", label: "E-Book" },
  { href: "/talisu/au", label: "Audio" },
  { href: "/talisu/reg", label: "Register" },
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
    id: "add-marketing-pins",
    kind: "do-more",
    label: "Add Marketing PINs",
    latitude: 58.806958,
    longitude: -100.599728,
    mapZoom: 5,
    description:
      "Add marketing PINs to grow your Root Mapsite™ network.",
    heroImageUrl: null,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 200,
  },
  {
    id: "add-adpro-sites",
    kind: "do-more",
    label: "Add Adpro Sites",
    latitude: 58.806958,
    longitude: -98.009728,
    mapZoom: 5,
    description: "Add Adpro Sites to formalize referral and co-promotion.",
    heroImageUrl: null,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: 210,
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

export function talisuMktsMarketPins(): TalisUMktsPin[] {
  return TALISU_MKTS_PINS.filter((pin) => pin.kind === "market");
}

export function talisuMktsDoMorePins(): TalisUMktsPin[] {
  return TALISU_MKTS_PINS.filter((pin) => pin.kind === "do-more");
}

export function talisuMktsPinById(id: string): TalisUMktsPin | undefined {
  return TALISU_MKTS_PINS.find((pin) => pin.id === id);
}
