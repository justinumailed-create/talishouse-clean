import {
  BUILD_MAPSITE_PREVIEW_LOCATION,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";

/** Demo builder (Ralf, Oct 26): Step 1's single address box. */
/** Neutral id/name (no "pin", "pass", "code", "user" or "login") so Safari and
 *  iCloud Keychain never treat it as a credential field (Ralf, Oct 26). */
export const DEMO_ADDRESS_INPUT_ID = "demo-home-location-street";
export const DEMO_ADDRESS_INPUT_NAME = "demo-location-street";

/** Query flag that opens the builder card directly (deep links, Back). */
export const DEMO_BUILD_QUERY = "build";

/**
 * One sample PIN for the hero display map. Same Canada preview point the
 * builder map uses (Niagara Falls region). Not a street address.
 */
export const DEMO_DISPLAY_PIN = {
  id: "demo-display-pin",
  latitude: BUILD_MAPSITE_PREVIEW_LOCATION.latitude,
  longitude: BUILD_MAPSITE_PREVIEW_LOCATION.longitude,
  zoom: BUILD_MAPSITE_PREVIEW_LOCATION.mapZoom,
} as const;

/** Actions a Mapsite PIN card shows. Display only — they do not navigate. */
export const DEMO_PIN_CARD_ACTIONS = ["URL 1", "URL 2", "TEB™", "TTV™"] as const;

/** The builder card starts open when the URL already carries build/address/PIN state. */
export function demoBuilderStartsOpen(params: Record<string, string | string[] | undefined>): boolean {
  return ["build", "address", "lat", "lng", "latitude", "longitude"].some((key) => {
    const value = params[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Prefill from a deep link (?address=…&lat=…&lng=…); ignores bad coordinates. */
export function demoInitialPinFromParams(
  params: Record<string, string | string[] | undefined>,
): Partial<HomePinLocationValues> {
  const out: Partial<HomePinLocationValues> = {};
  const address = firstParam(params.address).slice(0, 300);
  if (address) out.streetAddress = address;
  const lat = Number.parseFloat(firstParam(params.lat) || firstParam(params.latitude));
  const lng = Number.parseFloat(firstParam(params.lng) || firstParam(params.longitude));
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    out.latitude = String(lat);
    out.longitude = String(lng);
    out.manualPlacement = true;
  }
  return out;
}

/** First line of the Places address ("12 Main St, Town, …" → "12 Main St"). */
export function demoTitleFromAddress(address: string): string {
  const first = address.split(",")[0]?.trim() ?? "";
  return (first || address.trim()).slice(0, 120);
}

/** The visitor searched an address or moved the PIN off the preview spot. */
export function hasDemoPinChoice(pin: HomePinLocationValues): boolean {
  if (pin.streetAddress.trim() || pin.reverseGeocodedAddress.trim()) return true;
  const lat = Number.parseFloat(pin.latitude);
  const lng = Number.parseFloat(pin.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    Math.abs(lat - BUILD_MAPSITE_PREVIEW_LOCATION.latitude) > 1e-6 ||
    Math.abs(lng - BUILD_MAPSITE_PREVIEW_LOCATION.longitude) > 1e-6
  );
}

