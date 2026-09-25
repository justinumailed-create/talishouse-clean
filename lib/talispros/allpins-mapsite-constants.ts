/** Client-safe ALLPINS constants (no server / Supabase imports). */

export const ALLPINS_FAST_CODE = "allpins";

export function isAllPinsFastCode(
  value: string | null | undefined,
): boolean {
  return (value || "").trim().toLowerCase() === ALLPINS_FAST_CODE;
}

/**
 * ALLPINS geographic scope — Canada only (easy to widen later).
 *
 * Rule (either keeps the pin):
 * 1. Lat/lng inside CANADA_BOUNDS (approx. mainland + coasts + Arctic cushion), OR
 * 2. Address / label heuristic matches Canadian cues (country name or province tokens).
 *
 * Pins outside the bbox without Canadian address cues are dropped
 * (e.g. India SK01, Vietnam AG01). Widen by relaxing CANADA_BOUNDS or
 * adding region helpers beside isAllPinsInCanadaScope.
 */
export const CANADA_BOUNDS = {
  minLat: 41.5,
  maxLat: 83.5,
  minLng: -141.0,
  maxLng: -52.0,
} as const;

/** Empty / fallback viewport while Canada pins load (rough center of Canada). */
export const ALLPINS_CANADA_DEFAULT_VIEWPORT = {
  center: { latitude: 56.1, longitude: -96.0 },
  zoom: 4,
} as const;

const CANADA_ADDRESS_CUES =
  /\b(canada|canadian|\bns\b|nova\s*scotia|\bon\b|ontario|\bqc\b|quebec|québec|\bbc\b|british\s*columbia|\bab\b|alberta|\bmb\b|manitoba|\bsk\b|saskatchewan|\bnb\b|new\s*brunswick|\bpe\b|pei|prince\s*edward|\bnl\b|newfoundland|\bnt\b|northwest|\byt\b|yukon|\bnu\b|nunavut)\b/i;

export function isInsideCanadaBounds(
  latitude: number,
  longitude: number,
): boolean {
  return (
    latitude >= CANADA_BOUNDS.minLat &&
    latitude <= CANADA_BOUNDS.maxLat &&
    longitude >= CANADA_BOUNDS.minLng &&
    longitude <= CANADA_BOUNDS.maxLng
  );
}

export function looksCanadianAddress(
  ...parts: Array<string | null | undefined>
): boolean {
  const haystack = parts.filter(Boolean).join(" ").trim();
  if (!haystack) return false;
  return CANADA_ADDRESS_CUES.test(haystack);
}

/**
 * Primary ALLPINS inclusion predicate. Prefer bbox; address heuristic
 * recovers edge cases (e.g. geocode drift) without pulling in overseas pins.
 */
export function isAllPinsInCanadaScope(pin: {
  latitude: number;
  longitude: number;
  address?: string | null;
  label?: string | null;
}): boolean {
  if (
    !Number.isFinite(pin.latitude) ||
    !Number.isFinite(pin.longitude)
  ) {
    return false;
  }
  if (isInsideCanadaBounds(pin.latitude, pin.longitude)) return true;
  return looksCanadianAddress(pin.address, pin.label);
}
