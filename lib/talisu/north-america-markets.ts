/**
 * North American Markets for the public Home Market page (/home-market).
 *
 * Ralf, Nov 23: the public map no longer shows fixed market PINs. One old
 * regional PIN covered 4 (Canada) to 11+ (USA) Home Markets of about 100,000
 * people each, so visitors now place their own PIN (address, postal code or a
 * tap on the map) and that PIN defines their Home Market. The only fixed
 * marker left on the map is the Talishouse™ (Windswept) PIN. The regional rows
 * below stay for old `?market=` links and the admin maps.
 *
 * Canada: the 15 existing Canada market PINs from `markets-pins.ts`, unchanged
 * (Ralf, Nov 22: geography does not allow a grid there).
 * USA: 30 rural anchor-town PINs (Arun, Nov 22). Approximate town-centre
 * WGS84 points, used as the initial map pins only.
 * The Talishouse™ Modular Spaces PIN appears once, at its Canada location.
 *
 * No population figures here or on any public view (Ralf, Nov 22).
 * The older US city list in `us-markets-pins.ts` still serves the admin-only
 * /markets/usa map and is not used by this page.
 */

import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import {
  TALISU_MKTS_DO_MORE_PIN_SIZE,
  TALISU_MKTS_FLAG_CA,
  TALISU_MKTS_MARKET_PIN_SIZE,
  TALISU_MKTS_PINS,
  TALISU_MKTS_TREE_LOGO,
} from "@/lib/talisu/markets-pins";
import { TALISU_US_MKTS_FLAG } from "@/lib/talisu/us-markets-pins";

export { HOME_MARKET_PATH } from "@/lib/talisu/home-market-path";

export type HomeMarketCountry = "CA" | "US";

export type HomeMarketUsRow = {
  id: string;
  code: string;
  name: string;
  anchor: string;
  latitude: number;
  longitude: number;
};

/** The 30 US market territories, each with one rural anchor town. */
export const HOME_MARKET_US_ROWS: readonly HomeMarketUsRow[] = [
  { id: "us01", code: "US01", name: "Pacific Northwest & Alaska", anchor: "Ellensburg, WA", latitude: 46.996, longitude: -120.547 },
  { id: "us02", code: "US02", name: "Oregon & Inland Northwest", anchor: "La Grande, OR", latitude: 45.324, longitude: -118.087 },
  { id: "us03", code: "US03", name: "Northern California", anchor: "Redding, CA", latitude: 40.587, longitude: -122.392 },
  { id: "us04", code: "US04", name: "Central California", anchor: "Sonora, CA", latitude: 37.984, longitude: -120.382 },
  { id: "us05", code: "US05", name: "Southern California & Hawaii", anchor: "Temecula, CA", latitude: 33.494, longitude: -117.148 },
  { id: "us06", code: "US06", name: "Arizona & New Mexico", anchor: "Prescott Valley, AZ", latitude: 34.61, longitude: -112.316 },
  { id: "us07", code: "US07", name: "Rocky Mountain Region", anchor: "Laramie, WY", latitude: 41.312, longitude: -105.592 },
  { id: "us08", code: "US08", name: "Northern Plains", anchor: "North Platte, NE", latitude: 41.14, longitude: -100.761 },
  { id: "us09", code: "US09", name: "Central Plains", anchor: "Salina, KS", latitude: 38.84, longitude: -97.611 },
  { id: "us10", code: "US10", name: "Western Texas", anchor: "Canyon, TX", latitude: 34.981, longitude: -101.919 },
  { id: "us11", code: "US11", name: "North-Central Texas", anchor: "Stephenville, TX", latitude: 32.22, longitude: -98.202 },
  { id: "us12", code: "US12", name: "Southern Texas", anchor: "Kerrville, TX", latitude: 30.047, longitude: -99.14 },
  { id: "us13", code: "US13", name: "Upper Midwest", anchor: "Brainerd, MN", latitude: 46.358, longitude: -94.2 },
  { id: "us14", code: "US14", name: "Wisconsin & Western Great Lakes", anchor: "Wausau, WI", latitude: 44.96, longitude: -89.63 },
  { id: "us15", code: "US15", name: "Illinois & Western Midwest", anchor: "Galesburg, IL", latitude: 40.947, longitude: -90.371 },
  { id: "us16", code: "US16", name: "Indiana & Michigan", anchor: "Angola, IN", latitude: 41.634, longitude: -85.0 },
  { id: "us17", code: "US17", name: "Ohio & Eastern Great Lakes", anchor: "Wooster, OH", latitude: 40.805, longitude: -81.936 },
  { id: "us18", code: "US18", name: "Appalachia & Kentucky", anchor: "Morgantown, WV", latitude: 39.63, longitude: -79.956 },
  { id: "us19", code: "US19", name: "Pennsylvania & Northern Appalachia", anchor: "State College, PA", latitude: 40.793, longitude: -77.86 },
  { id: "us20", code: "US20", name: "New York Interior", anchor: "Oneonta, NY", latitude: 42.452, longitude: -75.063 },
  { id: "us21", code: "US21", name: "New England", anchor: "Keene, NH", latitude: 42.933, longitude: -72.278 },
  { id: "us22", code: "US22", name: "Mid-Atlantic North", anchor: "Winchester, VA", latitude: 39.185, longitude: -78.164 },
  { id: "us23", code: "US23", name: "Mid-Atlantic South", anchor: "Staunton, VA", latitude: 38.149, longitude: -79.072 },
  { id: "us24", code: "US24", name: "North Carolina", anchor: "Hickory, NC", latitude: 35.734, longitude: -81.341 },
  { id: "us25", code: "US25", name: "South Carolina & Georgia", anchor: "Aiken, SC", latitude: 33.56, longitude: -81.719 },
  { id: "us26", code: "US26", name: "Alabama & Southern Interior", anchor: "Eufaula, AL", latitude: 31.892, longitude: -85.145 },
  { id: "us27", code: "US27", name: "Tennessee & Arkansas", anchor: "Jackson, TN", latitude: 35.614, longitude: -88.814 },
  { id: "us28", code: "US28", name: "Louisiana & Mississippi", anchor: "Natchez, MS", latitude: 31.56, longitude: -91.403 },
  { id: "us29", code: "US29", name: "Florida Panhandle & North Florida", anchor: "Lake City, FL", latitude: 30.189, longitude: -82.639 },
  { id: "us30", code: "US30", name: "Western Florida & Puerto Rico", anchor: "Brooksville, FL", latitude: 28.555, longitude: -82.388 },
] as const;

export type HomeMarketPin = {
  id: string;
  kind: "market" | "talishouse";
  country: HomeMarketCountry;
  /** Prices on this site are CAD. US checkout in USD is not live yet. */
  currency: "CAD" | "USD";
  name: string;
  /** US anchor town, for example "Ellensburg, WA". Empty for Canada. */
  anchor: string;
  /** Visitor-placed PIN only: the address or place they searched / tapped. */
  address?: string;
  latitude: number;
  longitude: number;
  mapZoom: number;
  flagUrl: string;
};

const CANADA_MARKETS: HomeMarketPin[] = TALISU_MKTS_PINS.filter(
  (pin) => pin.kind === "market",
).map((pin) => ({
  id: `ca-${pin.id}`,
  kind: "market",
  country: "CA",
  currency: "CAD",
  name: pin.label,
  anchor: "",
  latitude: pin.latitude,
  longitude: pin.longitude,
  mapZoom: pin.mapZoom,
  flagUrl: TALISU_MKTS_FLAG_CA,
}));

const US_MARKETS: HomeMarketPin[] = HOME_MARKET_US_ROWS.map((row) => ({
  id: row.id,
  kind: "market",
  country: "US",
  currency: "USD",
  name: row.name,
  anchor: row.anchor,
  latitude: row.latitude,
  longitude: row.longitude,
  mapZoom: 7,
  flagUrl: TALISU_US_MKTS_FLAG,
}));

const TALISHOUSE_SOURCE = TALISU_MKTS_PINS.find((pin) => pin.id === "modular-spaces");

/** The one Talishouse™ PIN, at its Canada location. */
export const HOME_MARKET_TALISHOUSE_PIN: HomeMarketPin | null = TALISHOUSE_SOURCE
  ? {
      id: "talishouse",
      kind: "talishouse",
      country: "CA",
      currency: "CAD",
      name: TALISHOUSE_SOURCE.label,
      anchor: "",
      latitude: TALISHOUSE_SOURCE.latitude,
      longitude: TALISHOUSE_SOURCE.longitude,
      mapZoom: TALISHOUSE_SOURCE.mapZoom,
      flagUrl: TALISU_MKTS_TREE_LOGO,
    }
  : null;

/** 15 Canada + 30 US regional rows (old links and admin only; not on the public map). */
export const HOME_MARKET_MARKETS: readonly HomeMarketPin[] = [...CANADA_MARKETS, ...US_MARKETS];

/** All regional rows plus the Talishouse™ PIN (admin and tests; the public map uses HOME_MARKET_PUBLIC_PINS). */
export const HOME_MARKET_MAP_PINS: readonly HomeMarketPin[] = HOME_MARKET_TALISHOUSE_PIN
  ? [...HOME_MARKET_MARKETS, HOME_MARKET_TALISHOUSE_PIN]
  : HOME_MARKET_MARKETS;

export const HOME_MARKET_VIEWPORT = {
  center: { latitude: 48, longitude: -98 },
  zoom: 3,
} as const;

export function homeMarketById(id: string | null | undefined): HomeMarketPin | null {
  if (!id) return null;
  return HOME_MARKET_MARKETS.find((pin) => pin.id === id) ?? null;
}

/**
 * "Pacific Northwest & Alaska": no anchor-city names on public views, the USA
 * like Canada (Ralf, Nov 23). A placed PIN shows the visitor's own place.
 */
export function homeMarketDisplayName(pin: HomeMarketPin): string {
  return pin.name;
}

export function homeMarketFitCoordinates(): { latitude: number; longitude: number }[] {
  return HOME_MARKET_MAP_PINS.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude }));
}

export function homeMarketEnginePins(): MapEnginePin[] {
  return HOME_MARKET_MAP_PINS.map(
    (pin) =>
      ({
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        color: "#FFFFFF",
        featured: false,
        metadata: {
          icon: "dot",
          whiteCenter: true,
          customLogoUrl: pin.flagUrl,
          pinBorderColor: pin.kind === "market" ? "#CC8800" : "#000000",
          pinSize:
            pin.kind === "market" ? TALISU_MKTS_MARKET_PIN_SIZE : TALISU_MKTS_DO_MORE_PIN_SIZE,
          animated: false,
          label: pin.name,
        },
      }) satisfies MapEnginePin,
  );
}

/* ---------------------------------------------------------------------------
 * Visitor-placed Home Market PINs (Ralf, Nov 23)
 * ------------------------------------------------------------------------- */

/** Map zoom after the visitor places their PIN (town scale, roughly 100,000 people). */
export const HOME_MARKET_PLACED_ZOOM = 10;

/** Prefix of a visitor-placed market id: `pin-<lat>_<lng>`. */
export const HOME_MARKET_PLACED_PREFIX = "pin-";

const PLACED_ID = /^pin-(-?\d{1,2}(?:\.\d+)?)_(-?\d{1,3}(?:\.\d+)?)$/;
const PLACE_MAX = 120;

function roundCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function validLatLng(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export function homeMarketPlacedId(latitude: number, longitude: number): string {
  return `${HOME_MARKET_PLACED_PREFIX}${roundCoord(latitude)}_${roundCoord(longitude)}`;
}

/** Best guess at the country from the geocoded address, then the latitude. */
export function homeMarketCountryFor(address: string, latitude: number): HomeMarketCountry {
  if (/\b(USA|United States|Vereinigte Staaten)\b/i.test(address)) return "US";
  if (/\b(Canada|Kanada)\b/i.test(address)) return "CA";
  return latitude >= 49 ? "CA" : "US";
}

/** "123 Main St, Moncton, NB E1C 1A1, Canada" → "Moncton, NB E1C 1A1" style short label. */
export function homeMarketPlaceLabel(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(USA|United States|Canada|Kanada)$/i.test(part));
  if (parts.length === 0) return "";
  const short = parts.length > 2 ? parts.slice(-2) : parts;
  return short.join(", ").slice(0, PLACE_MAX);
}

/** The visitor's own PIN as a Home Market (nothing saved; client and URL only). */
export function placedHomeMarket({
  latitude,
  longitude,
  address = "",
}: {
  latitude: number;
  longitude: number;
  address?: string;
}): HomeMarketPin | null {
  if (!validLatLng(latitude, longitude)) return null;
  const lat = roundCoord(latitude);
  const lng = roundCoord(longitude);
  const cleanAddress = address.replace(/\s+/g, " ").trim().slice(0, PLACE_MAX * 2);
  const country = homeMarketCountryFor(cleanAddress, lat);
  const label = homeMarketPlaceLabel(cleanAddress) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  return {
    id: homeMarketPlacedId(lat, lng),
    kind: "market",
    country,
    currency: country === "US" ? "USD" : "CAD",
    name: label,
    anchor: "",
    address: cleanAddress,
    latitude: lat,
    longitude: lng,
    mapZoom: HOME_MARKET_PLACED_ZOOM,
    flagUrl: country === "US" ? TALISU_US_MKTS_FLAG : TALISU_MKTS_FLAG_CA,
  };
}

export function isPlacedHomeMarket(pin: HomeMarketPin | null | undefined): boolean {
  return Boolean(pin?.id.startsWith(HOME_MARKET_PLACED_PREFIX));
}

/**
 * `?market=pin-45.1_-64.2&place=Moncton, NB` (placed PIN) or an old
 * `?market=us07` regional link.
 */
export function homeMarketFromParams(
  market: string | null | undefined,
  place?: string | null,
): HomeMarketPin | null {
  const id = market?.trim() ?? "";
  const match = PLACED_ID.exec(id);
  if (match) {
    return placedHomeMarket({
      latitude: Number.parseFloat(match[1]),
      longitude: Number.parseFloat(match[2]),
      address: place ?? "",
    });
  }
  return homeMarketById(id);
}

/** The public map's fixed markers: only the Talishouse™ (Windswept) PIN. */
export const HOME_MARKET_PUBLIC_PINS: readonly HomeMarketPin[] = HOME_MARKET_TALISHOUSE_PIN
  ? [HOME_MARKET_TALISHOUSE_PIN]
  : [];

/** North America at a glance (the public map's reset view). */
export const HOME_MARKET_NORTH_AMERICA_FIT: readonly { latitude: number; longitude: number }[] = [
  { latitude: 60.5, longitude: -135 },
  { latitude: 25.5, longitude: -80.5 },
  { latitude: 47.5, longitude: -52.7 },
  { latitude: 32.5, longitude: -117.1 },
];

/** Engine pin for the visitor's own Home PIN (blue, pulsing, draggable). */
export function homeMarketPlacedEnginePin(pin: HomeMarketPin): MapEnginePin {
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    color: "#046BD9",
    featured: true,
    metadata: {
      icon: "dot",
      whiteCenter: true,
      customLogoUrl: pin.flagUrl,
      pinBorderColor: "#046BD9",
      pinSize: TALISU_MKTS_MARKET_PIN_SIZE,
      animated: true,
      label: pin.name,
    },
  } satisfies MapEnginePin;
}

/** Talishouse™ PIN plus, once placed, the visitor's own Home PIN. */
export function homeMarketPublicEnginePins(placed: HomeMarketPin | null): MapEnginePin[] {
  const base = homeMarketEnginePins().filter((pin) => pin.id === HOME_MARKET_TALISHOUSE_PIN?.id);
  return placed ? [...base, homeMarketPlacedEnginePin(placed)] : base;
}
