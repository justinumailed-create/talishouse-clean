import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { ROUTES } from "@/lib/routes";

export const MAPSITE_URL_GATE_HEADLINE = "Register YOUR Mapsite™";

export function listingResourceHref(value: string | null | undefined): string | null {
  const href = value?.trim() || "";
  if (!href) return null;
  if (/^https?:\/\//i.test(href) || href.startsWith("/")) return href;
  return `https://${href}`;
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

/** URL button goes through the PIN gate when a listing URL was submitted. */
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

export function generateUrlGatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function urlGatePepper(): string {
  return (
    process.env.MAPSITE_URL_PIN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "talispros-url-gate"
  );
}

export function hashUrlGatePin(fastCode: string, pin: string): string {
  const code = fastCode.trim().toLowerCase();
  return createHash("sha256")
    .update(`${urlGatePepper()}:${code}:${pin}`)
    .digest("hex");
}

export function urlGatePinsMatch(
  fastCode: string,
  pin: string,
  storedHash: string,
): boolean {
  const actual = Buffer.from(hashUrlGatePin(fastCode, pin), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
