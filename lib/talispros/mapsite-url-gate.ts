import { ROUTES } from "@/lib/routes";

export const MAPSITE_URL_GATE_HEADLINE = "Secure URL access";

/** PIN lifetime after generate. Documented default for phone/WhatsApp handoff. */
export const MAPSITE_URL_GATE_TTL_MS = 30 * 60 * 1000;

/** Cooldown between regenerations for the same Mapsite™ (spam guard). */
export const MAPSITE_URL_GATE_REGEN_COOLDOWN_MS = 10 * 1000;

export const MAPSITE_URL_GATE_TTL_LABEL = "30 minutes";

export function listingResourceHref(value: string | null | undefined): string | null {
  const href = value?.trim() || "";
  if (!href) return null;
  if (/^https?:\/\//i.test(href) || href.startsWith("/")) return href;
  return `https://${href}`;
}

/** True when the Mapsite™ has a stored payment/listing URL that must be gated. */
export function mapsiteHasGatedUrl(brokerUrl: string | null | undefined): boolean {
  return Boolean(listingResourceHref(brokerUrl));
}

export function registerYourMapSiteFastCodeFromPath(
  pathname: string | null | undefined,
): string | null {
  const match = pathname?.match(
    /^\/talispros\/register-your-mapsite\/([^/?#]+)/i,
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase() || null;
  } catch {
    return match[1].trim().toLowerCase() || null;
  }
}

export function mapsiteUrlGatePath(fastCode: string): string {
  return `${ROUTES.TALISPROS_REGISTER_YOUR_MAPSITE}/${encodeURIComponent(
    fastCode.trim().toLowerCase(),
  )}`;
}

/**
 * Deep-link to the standalone gate page (fallback). Published Mapsite™ URL
 * buttons open an on-page popup instead of navigating here immediately.
 */
export function mapsiteUrlGateHref(
  fastCode: string | null | undefined,
  brokerUrl: string | null | undefined,
): string | null {
  const dest = listingResourceHref(brokerUrl);
  if (!dest) return null;
  const code = fastCode?.trim();
  if (!code) return dest;
  return mapsiteUrlGatePath(code);
}

export function normalizeUrlGatePin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isUrlGatePinFormat(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function urlGateExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + MAPSITE_URL_GATE_TTL_MS);
}

export function isUrlGateExpired(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return true;
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  return expires <= now.getTime();
}
