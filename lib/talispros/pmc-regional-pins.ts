import type { MapEnginePin } from "@/lib/talismaps/map-engine";

export type PmcCountry = "CA" | "US";
export type PmcRegionGroup = "canada" | "usa";

export interface PmcRegionalPin {
  id: string;
  country: PmcCountry;
  regionGroup: PmcRegionGroup;
  label: string;
  latitude: number;
  longitude: number;
  /** Focus zoom when the pin card opens. */
  mapZoom: number;
  pinColor: string;
  logoUrl: string;
  visible: boolean;
  sortOrder: number;
  description: string;
}

export const PMC_FLAG_CA = "/flags/ca.svg";
export const PMC_FLAG_US = "/flags/us.svg";

export const PMC_MAP_VIEWPORT = {
  center: { latitude: 49.2, longitude: -96.5 },
  zoom: 4,
} as const;

export const PMC_ACCOUNT_BULLETS = [
  "Root Accounts can register Derivative Accounts, which are advertising and SPLITS enabled — you get a cut.",
  "Derivative Accounts promote pins and can earn advertising revenue.",
  "Adpro Accounts formalize referral and co-promotion networks.",
] as const;

/** Default regional Root Account pins for Talispros™ PMC (brokers MapSite). */
export const PMC_DEFAULT_REGIONAL_PINS: readonly PmcRegionalPin[] = [
  {
    id: "nl",
    country: "CA",
    regionGroup: "canada",
    label: "Newfoundland & Labrador",
    latitude: 48.95,
    longitude: -56.1,
    mapZoom: 6,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 10,
    description: "Root Account™ market for Newfoundland & Labrador.",
  },
  {
    id: "ns",
    country: "CA",
    regionGroup: "canada",
    label: "Nova Scotia",
    latitude: 45.1,
    longitude: -63.2,
    mapZoom: 7,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 20,
    description: "Root Account™ market for Nova Scotia.",
  },
  {
    id: "nb-pei",
    country: "CA",
    regionGroup: "canada",
    label: "New Brunswick & PEI",
    latitude: 46.35,
    longitude: -64.8,
    mapZoom: 7,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 30,
    description: "Root Account™ market for New Brunswick & Prince Edward Island.",
  },
  {
    id: "qc",
    country: "CA",
    regionGroup: "canada",
    label: "Quebec",
    latitude: 52.0,
    longitude: -72.5,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 40,
    description: "Root Account™ market for Quebec.",
  },
  {
    id: "on-east",
    country: "CA",
    regionGroup: "canada",
    label: "Eastern Ontario",
    latitude: 45.42,
    longitude: -75.7,
    mapZoom: 7,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 50,
    description: "Root Account™ market for Eastern Ontario.",
  },
  {
    id: "on-south",
    country: "CA",
    regionGroup: "canada",
    label: "Southern Ontario",
    latitude: 43.7,
    longitude: -79.4,
    mapZoom: 7,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 60,
    description: "Root Account™ market for Southern Ontario.",
  },
  {
    id: "on-north",
    country: "CA",
    regionGroup: "canada",
    label: "Northern Ontario",
    latitude: 49.8,
    longitude: -86.0,
    mapZoom: 6,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 70,
    description: "Root Account™ market for Northern Ontario.",
  },
  {
    id: "on-west",
    country: "CA",
    regionGroup: "canada",
    label: "Western Ontario",
    latitude: 43.0,
    longitude: -81.25,
    mapZoom: 7,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 80,
    description: "Root Account™ market for Western Ontario.",
  },
  {
    id: "mb",
    country: "CA",
    regionGroup: "canada",
    label: "Manitoba",
    latitude: 53.8,
    longitude: -97.5,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 90,
    description: "Root Account™ market for Manitoba.",
  },
  {
    id: "sk",
    country: "CA",
    regionGroup: "canada",
    label: "Saskatchewan",
    latitude: 54.0,
    longitude: -106.0,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 100,
    description: "Root Account™ market for Saskatchewan.",
  },
  {
    id: "ab",
    country: "CA",
    regionGroup: "canada",
    label: "Alberta",
    latitude: 54.5,
    longitude: -115.0,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 110,
    description: "Root Account™ market for Alberta.",
  },
  {
    id: "bc",
    country: "CA",
    regionGroup: "canada",
    label: "British Columbia",
    latitude: 54.0,
    longitude: -125.0,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 120,
    description: "Root Account™ market for British Columbia.",
  },
  {
    id: "yt",
    country: "CA",
    regionGroup: "canada",
    label: "Yukon Territory",
    latitude: 64.0,
    longitude: -135.0,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 130,
    description: "Root Account™ market for Yukon Territory.",
  },
  {
    id: "nt",
    country: "CA",
    regionGroup: "canada",
    label: "Northwest Territories",
    latitude: 64.5,
    longitude: -116.0,
    mapZoom: 5,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 140,
    description: "Root Account™ market for Northwest Territories.",
  },
  {
    id: "nu",
    country: "CA",
    regionGroup: "canada",
    label: "Nunavut",
    latitude: 64.5,
    longitude: -96.0,
    mapZoom: 4,
    pinColor: "#FF0000",
    logoUrl: PMC_FLAG_CA,
    visible: true,
    sortOrder: 150,
    description: "Root Account™ market for Nunavut.",
  },
  {
    id: "usa",
    country: "US",
    regionGroup: "usa",
    label: "United States",
    latitude: 39.5,
    longitude: -98.35,
    mapZoom: 4,
    pinColor: "#3C3B6E",
    logoUrl: PMC_FLAG_US,
    visible: true,
    sortOrder: 200,
    description: "Root Account™ market for the United States.",
  },
] as const;

export function sortPmcPins(pins: PmcRegionalPin[]): PmcRegionalPin[] {
  return [...pins].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function visiblePmcPins(pins: PmcRegionalPin[]): PmcRegionalPin[] {
  return sortPmcPins(pins.filter((pin) => pin.visible));
}

export function pmcPinsByRegionGroup(
  pins: PmcRegionalPin[],
  group: PmcRegionGroup
): PmcRegionalPin[] {
  return visiblePmcPins(pins).filter((pin) => pin.regionGroup === group);
}

export function pmcPinToMapEnginePin(pin: PmcRegionalPin): MapEnginePin {
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    color: pin.pinColor,
    featured: pin.regionGroup === "usa",
    metadata: {
      icon: "dot",
      whiteCenter: true,
      customLogoUrl: pin.logoUrl,
      pinSize: 58,
      animated: false,
      pmc: true,
      country: pin.country,
      regionGroup: pin.regionGroup,
      label: pin.label,
    },
  };
}

export function pmcPinsToMapEnginePins(pins: PmcRegionalPin[]): MapEnginePin[] {
  return visiblePmcPins(pins).map(pmcPinToMapEnginePin);
}

export function mergePmcPinDefaults(
  overrides: Partial<PmcRegionalPin>[]
): PmcRegionalPin[] {
  const byId = new Map(overrides.map((row) => [row.id, row]));
  return sortPmcPins(
    PMC_DEFAULT_REGIONAL_PINS.map((base) => {
      const override = byId.get(base.id);
      if (!override) return { ...base };
      return {
        ...base,
        ...override,
        id: base.id,
        country: override.country ?? base.country,
        regionGroup: override.regionGroup ?? base.regionGroup,
        label: override.label?.trim() || base.label,
        latitude:
          typeof override.latitude === "number" ? override.latitude : base.latitude,
        longitude:
          typeof override.longitude === "number"
            ? override.longitude
            : base.longitude,
        mapZoom:
          typeof override.mapZoom === "number" ? override.mapZoom : base.mapZoom,
        pinColor: override.pinColor?.trim() || base.pinColor,
        logoUrl: override.logoUrl?.trim() || base.logoUrl,
        visible: override.visible ?? base.visible,
        sortOrder:
          typeof override.sortOrder === "number"
            ? override.sortOrder
            : base.sortOrder,
        description: override.description?.trim() || base.description,
      };
    })
  );
}
