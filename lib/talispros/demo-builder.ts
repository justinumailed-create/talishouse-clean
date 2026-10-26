import {
  BUILD_MAPSITE_PREVIEW_LOCATION,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";

/** Demo builder (Ralf, Oct 26): Step 1's single address box. */
export const DEMO_ADDRESS_INPUT_ID = "demo-home-pin-address";

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

