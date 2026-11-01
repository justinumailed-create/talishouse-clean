/**
 * USA Markets (/talisu/mkts/usa): the 30 US market PINs, rendered natively on
 * Tsplits™ with the same Talismaps™ map, card and sidebar as Canada Markets.
 *
 * Source (read-only copy, Nov 1 2026): the live Taliswebs Markets map
 * page, its 30 market rows (code, name,
 * population, anchor cities, lat/lng, zoom) and its circular US-flag pin image
 * (/talisu/us-flag-pin.webp → public/talisu/mkts/us-flag-pin.webp). Taliswebs
 * and the Canada pins are untouched. Taliswebs' USD market rate is not shown
 * here (this site quotes CAD only).
 */

import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import {
  TALISU_MKTS_DO_MORE_PIN_SIZE,
  TALISU_MKTS_DEMO_HREF,
  TALISU_MKTS_MARKET_HERO,
  TALISU_MKTS_MARKET_PIN_SIZE,
  TALISU_MKTS_MODULAR_HERO,
  TALISU_MKTS_TREE_LOGO,
  type TalisUMktsPin,
} from "@/lib/talisu/markets-pins";

/** Circular US-flag pin (same artwork as the Taliswebs US market pins). */
export const TALISU_US_MKTS_FLAG = "/talisu/mkts/us-flag-pin.webp";

/** Contiguous-US fallback before fitBounds settles. */
export const TALISU_US_MKTS_VIEWPORT = {
  center: { latitude: 39.8, longitude: -98.6 },
  zoom: 3.8,
} as const;

export type TalisUUsMarket = {
  id: string;
  code: string;
  name: string;
  population: number;
  anchors: readonly string[];
  latitude: number;
  longitude: number;
  mapZoom: number;
};

export const TALISU_US_MARKETS: readonly TalisUUsMarket[] = [
  { id: "m01", code: "M01", name: "Northern New England", population: 8500000, anchors: ["Portland", "Manchester", "Providence", "Hartford"], latitude: 43.6591, longitude: -70.2568, mapZoom: 7 },
  { id: "m02", code: "M02", name: "Boston & Coastal New England", population: 9200000, anchors: ["Boston", "Worcester", "Stamford", "Bridgeport"], latitude: 42.3601, longitude: -71.0589, mapZoom: 7 },
  { id: "m03", code: "M03", name: "New York City Metro", population: 12400000, anchors: ["Manhattan", "Brooklyn", "Queens", "Long Island"], latitude: 40.758, longitude: -73.9855, mapZoom: 7 },
  { id: "m04", code: "M04", name: "Hudson Valley & Northern NJ", population: 9800000, anchors: ["Newark", "Jersey City", "Albany", "Yonkers"], latitude: 40.7357, longitude: -74.1724, mapZoom: 7 },
  { id: "m05", code: "M05", name: "Delaware Valley & Garden State", population: 10100000, anchors: ["Philadelphia", "Wilmington", "Camden", "Trenton"], latitude: 39.9526, longitude: -75.1652, mapZoom: 7 },
  { id: "m06", code: "M06", name: "Chesapeake & Potomac Basin", population: 11200000, anchors: ["Baltimore", "Bethesda", "Arlington", "Washington D.C."], latitude: 39.2904, longitude: -76.6122, mapZoom: 7 },
  { id: "m07", code: "M07", name: "Laurentian & Great Lakes East", population: 9500000, anchors: ["Buffalo", "Rochester", "Syracuse", "Pittsburgh"], latitude: 42.8864, longitude: -78.8784, mapZoom: 7 },
  { id: "m08", code: "M08", name: "Erie Shore & Ohio Heartland", population: 10400000, anchors: ["Cleveland", "Columbus", "Akron", "Canton"], latitude: 41.4993, longitude: -81.6944, mapZoom: 7 },
  { id: "m09", code: "M09", name: "Bluegrass & Ohio Valley", population: 9900000, anchors: ["Cincinnati", "Louisville", "Lexington", "Charleston"], latitude: 39.1031, longitude: -84.512, mapZoom: 7 },
  { id: "m10", code: "M10", name: "Michigan Peninsula & Toledoland", population: 10500000, anchors: ["Detroit", "Grand Rapids", "Flint", "Toledo"], latitude: 42.3314, longitude: -83.0458, mapZoom: 7 },
  { id: "m11", code: "M11", name: "Chicagoland & Calumet", population: 11100000, anchors: ["Chicago", "Aurora", "Joliet", "Gary"], latitude: 41.8781, longitude: -87.6298, mapZoom: 7 },
  { id: "m12", code: "M12", name: "Upper Mississippi & Cream City", population: 10300000, anchors: ["Milwaukee", "Minneapolis", "St. Paul", "Fargo"], latitude: 43.0389, longitude: -87.9065, mapZoom: 7 },
  { id: "m13", code: "M13", name: "Prairie State & Mid-America", population: 9600000, anchors: ["Springfield", "Des Moines", "St. Louis"], latitude: 39.7817, longitude: -89.6501, mapZoom: 7 },
  { id: "m14", code: "M14", name: "Ozarks & Lower Missouri", population: 8900000, anchors: ["Kansas City", "Wichita", "Topeka", "Omaha"], latitude: 39.0997, longitude: -94.5786, mapZoom: 7 },
  { id: "m15", code: "M15", name: "Virginia Piedmont & Carolina North", population: 10200000, anchors: ["Richmond", "Norfolk", "Raleigh", "Durham", "Greensboro"], latitude: 37.5407, longitude: -77.436, mapZoom: 7 },
  { id: "m16", code: "M16", name: "Carolina Coast & Palmetto", population: 9400000, anchors: ["Charlotte", "Wilmington", "Columbia", "Charleston"], latitude: 35.2271, longitude: -80.8431, mapZoom: 7 },
  { id: "m17", code: "M17", name: "Peachtree & North Georgia", population: 8800000, anchors: ["Atlanta", "Athens", "Augusta", "Macon"], latitude: 33.749, longitude: -84.388, mapZoom: 7 },
  { id: "m18", code: "M18", name: "Tennessee Valley & Southern Appalachia", population: 9700000, anchors: ["Nashville", "Memphis", "Knoxville", "Huntsville"], latitude: 36.1627, longitude: -86.7816, mapZoom: 7 },
  { id: "m19", code: "M19", name: "Gulf Coast & Mississippi Delta", population: 10100000, anchors: ["Jackson", "New Orleans", "Baton Rouge", "Mobile"], latitude: 32.2988, longitude: -90.1848, mapZoom: 7 },
  { id: "m20", code: "M20", name: "Florida Atlantic Coast", population: 10800000, anchors: ["Miami", "Fort Lauderdale", "Orlando", "Jacksonville"], latitude: 25.7617, longitude: -80.1918, mapZoom: 7 },
  { id: "m21", code: "M21", name: "Florida Gulf Coast, Suncoast & Puerto Rico", population: 14600000, anchors: ["Tampa", "St. Petersburg", "Sarasota", "Fort Myers"], latitude: 27.9506, longitude: -82.4572, mapZoom: 7 },
  { id: "m22", code: "M22", name: "North Texas & Red River", population: 10500000, anchors: ["Dallas", "Fort Worth", "Plano", "Tulsa"], latitude: 32.7767, longitude: -96.797, mapZoom: 7 },
  { id: "m23", code: "M23", name: "Texas Gulf Coast & Alamo", population: 11300000, anchors: ["Houston", "San Antonio", "Corpus Christi", "Brownsville"], latitude: 29.7604, longitude: -95.3698, mapZoom: 7 },
  { id: "m24", code: "M24", name: "Texas Triangle West & Plains", population: 9200000, anchors: ["Austin", "Lubbock", "Amarillo", "Oklahoma City"], latitude: 30.2672, longitude: -97.7431, mapZoom: 7 },
  { id: "m25", code: "M25", name: "Arid Northwest & High Plains", population: 8600000, anchors: ["Denver", "Salt Lake City", "Boise", "Cheyenne"], latitude: 39.7392, longitude: -104.9903, mapZoom: 7 },
  { id: "m26", code: "M26", name: "Desert Southwest & Colorado Basin", population: 9900000, anchors: ["Phoenix", "Tucson", "Albuquerque", "Las Vegas", "El Paso"], latitude: 33.4484, longitude: -112.074, mapZoom: 7 },
  { id: "m27", code: "M27", name: "Pacific Northwest & Alaska", population: 11800000, anchors: ["Seattle", "Tacoma", "Portland", "Eugene", "Anchorage"], latitude: 47.6062, longitude: -122.3321, mapZoom: 7 },
  { id: "m28", code: "M28", name: "Northern California & Sierras", population: 11500000, anchors: ["San Francisco", "San Jose", "Oakland", "Sacramento", "Reno"], latitude: 37.7749, longitude: -122.4194, mapZoom: 7 },
  { id: "m29", code: "M29", name: "Angelenos & Central Coast", population: 12100000, anchors: ["Los Angeles", "Glendale", "Santa Barbara", "San Luis Obispo"], latitude: 34.0522, longitude: -118.2437, mapZoom: 7 },
  { id: "m30", code: "M30", name: "Southern California & Hawaii", population: 13200000, anchors: ["Anaheim", "Santa Ana", "San Diego", "Riverside", "San Bernardino"], latitude: 33.8366, longitude: -117.9143, mapZoom: 7 },
] as const;

export type TalisUUsMktsPin = TalisUMktsPin & {
  population: number | null;
  anchors: readonly string[];
};

/** Market PINs (→ Demo path) plus the Talishouse™ Modular Spaces PIN. */
export const TALISU_US_MKTS_PINS: readonly TalisUUsMktsPin[] = [
  ...TALISU_US_MARKETS.map((m, index) => ({
    id: m.id,
    kind: "market" as const,
    label: `${m.code} ${m.name}`,
    latitude: m.latitude,
    longitude: m.longitude,
    mapZoom: m.mapZoom,
    description: "",
    population: m.population,
    anchors: m.anchors,
    heroImageUrl: TALISU_MKTS_MARKET_HERO,
    nextHref: TALISU_MKTS_DEMO_HREF,
    nextLabel: "Next Step...",
    showOnMap: true,
    sortOrder: (index + 1) * 10,
  })),
  {
    id: "modular-spaces",
    kind: "do-more" as const,
    label: "Talishouse™ Modular Spaces",
    latitude: 52.1,
    longitude: -99.95,
    mapZoom: 5,
    description:
      "Every registered market includes supply side access to a broad array of structures for DIY construction.",
    population: null,
    anchors: [],
    heroImageUrl: TALISU_MKTS_MODULAR_HERO,
    nextHref: "/catalogue",
    nextLabel: "Catalogue",
    showOnMap: true,
    sortOrder: 1000,
  },
];

export type TalisUUsMktsCopy = {
  pinLabels: Readonly<Record<string, string>>;
  doMoreDescriptions: Readonly<Record<string, string>>;
  marketDescription: string;
  nextLabel: string;
  us: {
    populationLabel: string;
    millionUnit: string;
    decimalMark: string;
    anchorsLabel: string;
  };
};

/** "Population 8.5 million. Anchor cities: …. Claim …" (no price). */
export function localizeTalisUUsMktsPins(
  pins: readonly TalisUUsMktsPin[],
  copy: TalisUUsMktsCopy,
): TalisUUsMktsPin[] {
  return pins.map((pin) => {
    if (pin.kind !== "market") {
      return {
        ...pin,
        label: copy.pinLabels[pin.id] ?? pin.label,
        description: copy.doMoreDescriptions[pin.id] ?? pin.description,
      };
    }
    const millions = ((pin.population ?? 0) / 1e6)
      .toFixed(1)
      .replace(".", copy.us.decimalMark);
    return {
      ...pin,
      description: `${copy.us.populationLabel} ${millions} ${copy.us.millionUnit}. ${copy.us.anchorsLabel}: ${pin.anchors.join(", ")}. ${copy.marketDescription}`,
      nextLabel: copy.nextLabel,
    };
  });
}

export function talisuUsMktsMapCoordinates(): { latitude: number; longitude: number }[] {
  return TALISU_US_MKTS_PINS.filter((pin) => pin.showOnMap).map((pin) => ({
    latitude: pin.latitude,
    longitude: pin.longitude,
  }));
}

/** Same pin styling as Canada Markets, with the US flag on market PINs. */
export function talisuUsMktsToEnginePins(
  pins: readonly TalisUMktsPin[] = TALISU_US_MKTS_PINS,
): MapEnginePin[] {
  return pins
    .filter((pin) => pin.showOnMap)
    .map((pin) => ({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      color: "#FFFFFF",
      featured: false,
      metadata: {
        icon: "dot",
        whiteCenter: true,
        customLogoUrl:
          pin.kind === "market" ? TALISU_US_MKTS_FLAG : TALISU_MKTS_TREE_LOGO,
        pinBorderColor: pin.kind === "market" ? "#CC8800" : "#000000",
        pinSize:
          pin.kind === "market"
            ? TALISU_MKTS_MARKET_PIN_SIZE
            : TALISU_MKTS_DO_MORE_PIN_SIZE,
        animated: false,
        label: pin.label,
      },
    }) satisfies MapEnginePin);
}
