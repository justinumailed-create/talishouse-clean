export interface HomePinLocationValues {
  streetAddress: string;
  latitude: string;
  longitude: string;
  /** True when the PIN was placed or moved on the map (click or drag). */
  manualPlacement: boolean;
  /** Address resolved from coordinates; never overwrites streetAddress. */
  reverseGeocodedAddress: string;
  /** User-controlled preview zoom — carried onto the created Mapsite™. */
  mapZoom: number;
  pinWriteup: string;
  futurePinColor: string | null;
  futurePinIcon: string | null;
  futurePinBorder: string | null;
  futurePinLabel: string | null;
  futurePinWhiteCenter: boolean;
  futurePinAnimated: boolean;
  futurePinCategoryBadge: string | null;
}

/** Default Build A Mapsite™ PIN preview — Niagara Falls / Canada border. */
export const BUILD_MAPSITE_PREVIEW_LOCATION = {
  latitude: 43.105808,
  longitude: -79.058733,
  /** Regional framing: Niagara Falls, Canada, and the border. */
  mapZoom: 12,
} as const;

export const defaultHomePinLocationValues: HomePinLocationValues = {
  streetAddress: "",
  latitude: String(BUILD_MAPSITE_PREVIEW_LOCATION.latitude),
  longitude: String(BUILD_MAPSITE_PREVIEW_LOCATION.longitude),
  manualPlacement: true,
  reverseGeocodedAddress: "",
  mapZoom: BUILD_MAPSITE_PREVIEW_LOCATION.mapZoom,
  pinWriteup: "",
  futurePinColor: "#1A73E8",
  futurePinIcon: "none",
  futurePinBorder: "none",
  futurePinLabel: "",
  futurePinWhiteCenter: false,
  futurePinAnimated: false,
  futurePinCategoryBadge: null,
};

export const PIN_WRITEUP_MAX_LENGTH = 170;

export const PIN_ICON_OPTIONS = [
  { value: "none", label: "None (hollow)" },
  { value: "flag", label: "Flag / Sign" },
  { value: "home", label: "Home" },
  { value: "star", label: "Star" },
  { value: "building", label: "Building" },
  { value: "map-pin", label: "Map Pin" },
  { value: "landmark", label: "Landmark" },
] as const;

export const PIN_BORDER_OPTIONS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
] as const;

export const PIN_CATEGORY_BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "for-sale", label: "For Sale" },
  { value: "new-listing", label: "New Listing" },
  { value: "open-house", label: "Open House" },
  { value: "builder", label: "Builder" },
  { value: "fsbo", label: "FSBO" },
] as const;
