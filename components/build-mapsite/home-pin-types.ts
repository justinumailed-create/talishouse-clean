import { MAPSITE_DEMO_LOCATION } from "@/lib/mapsite/demo-location";

export interface HomePinLocationValues {
  streetAddress: string;
  latitude: string;
  longitude: string;
  /** True when the PIN was placed or moved on the map (click or drag). */
  manualPlacement: boolean;
  /** Address resolved from coordinates; never overwrites streetAddress. */
  reverseGeocodedAddress: string;
  pinWriteup: string;
  futurePinColor: string | null;
  futurePinIcon: string | null;
  futurePinBorder: string | null;
  futurePinLabel: string | null;
  futurePinWhiteCenter: boolean;
  futurePinAnimated: boolean;
  futurePinCategoryBadge: string | null;
}

export const defaultHomePinLocationValues: HomePinLocationValues = {
  streetAddress: MAPSITE_DEMO_LOCATION.streetAddress,
  latitude: String(MAPSITE_DEMO_LOCATION.latitude),
  longitude: String(MAPSITE_DEMO_LOCATION.longitude),
  manualPlacement: true,
  reverseGeocodedAddress: MAPSITE_DEMO_LOCATION.streetAddress,
  pinWriteup: "",
  futurePinColor: "#1C1C1E",
  futurePinIcon: "dot",
  futurePinBorder: "none",
  futurePinLabel: "",
  futurePinWhiteCenter: true,
  futurePinAnimated: false,
  futurePinCategoryBadge: null,
};

export const PIN_WRITEUP_MAX_LENGTH = 170;

export const PIN_ICON_OPTIONS = [
  { value: "dot", label: "Dot" },
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
