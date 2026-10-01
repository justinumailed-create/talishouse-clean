import { ROUTES } from "@/lib/routes";

export const MAPSITE_URL_GATE_HEADLINE = "Secure URL access";

/** PIN lifetime after generate. Documented default for phone/WhatsApp handoff. */
export const MAPSITE_URL_GATE_TTL_MS = 30 * 60 * 1000;

/** Cooldown between regenerations for the same Mapsite™ (spam guard). */
export const MAPSITE_URL_GATE_REGEN_COOLDOWN_MS = 10 * 1000;

export const MAPSITE_URL_GATE_TTL_LABEL = "30 minutes";

/** Sentinel href used by the published Mapsite™ URL button when the gate applies. */
export const MAPSITE_URL_GATE_SENTINEL = "__url_gate__";

/**
 * FAST codes that skip the Admin Notifications secure-code URL unlock.
 * Normalized lower-case; compare with normalizeMapsiteUrlGateFastCode.
 */
export const MAPSITE_URL_GATE_EXEMPT_FAST_CODES = ["dc01", "dc02"] as const;

/**
 * Listing/payment URL overrides for specific FAST codes (case-insensitive key).
 * Wins over the stored mapsites.broker_url for the published URL button / unlock.
 */
export const MAPSITE_URL_OVERRIDES: Readonly<Record<string, string>> = {
  dc01: "https://talispros.mysamcart.com/checkout/register",
  dc02: "https://talispros.mysamcart.com/checkout/register",
};

export function normalizeMapsiteUrlGateFastCode(
  value: string | null | undefined,
): string {
  return (value || "").trim().toLowerCase();
}

export function isMapsiteUrlGateExempt(
  fastCode: string | null | undefined,
): boolean {
  const code = normalizeMapsiteUrlGateFastCode(fastCode);
  return (MAPSITE_URL_GATE_EXEMPT_FAST_CODES as readonly string[]).includes(
    code,
  );
}

export function mapsiteListingUrlOverride(
  fastCode: string | null | undefined,
): string | null {
  const code = normalizeMapsiteUrlGateFastCode(fastCode);
  return MAPSITE_URL_OVERRIDES[code] ?? null;
}


export function listingResourceHref(value: string | null | undefined): string | null {
  const href = value?.trim() || "";
  if (!href) return null;
  if (/^https?:\/\//i.test(href) || href.startsWith("/")) return href;
  return `https://${href}`;
}

/**
 * Effective listing/payment URL: FAST-code override wins over stored broker_url.
 */
export function resolveMapsiteListingUrl(
  fastCode: string | null | undefined,
  brokerUrl: string | null | undefined,
): string | null {
  return listingResourceHref(
    mapsiteListingUrlOverride(fastCode) ?? brokerUrl,
  );
}

/** True when the Mapsite™ has a payment/listing URL (stored or overridden). */
export function mapsiteHasGatedUrl(
  brokerUrl: string | null | undefined,
  fastCode?: string | null,
): boolean {
  return Boolean(resolveMapsiteListingUrl(fastCode, brokerUrl));
}

/**
 * Published Mapsite™ URL button href: direct link when exempt, gate sentinel
 * when gated, or null when no listing URL is available.
 */
export function resolvePublishedUrlButtonHref(
  fastCode: string | null | undefined,
  brokerUrl: string | null | undefined,
): string | null {
  const dest = resolveMapsiteListingUrl(fastCode, brokerUrl);
  if (!dest) return null;
  if (isMapsiteUrlGateExempt(fastCode)) return dest;
  // Claimed-demo stand-in: URL button shows the register path (FAST Code™ gate).
  if (isMapsiteRegisterPathStandIn(dest)) {
    const code = fastCode?.trim();
    if (!code) return dest;
    return mapsiteUrlGatePath(code);
  }
  return MAPSITE_URL_GATE_SENTINEL;
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
  const dest = resolveMapsiteListingUrl(fastCode, brokerUrl);
  if (!dest) return null;
  if (isMapsiteUrlGateExempt(fastCode)) return dest;
  const code = fastCode?.trim();
  if (!code) return dest;
  return mapsiteUrlGatePath(code);
}


/**
 * Stand-in until SamCart payment success: when broker_url is the local
 * register-your-mapsite path (or a bare homepage), unlock opens the claimed
 * Mapsite™ instead of looping the gate or dumping to `/`.
 */
export function isMapsiteRegisterPathStandIn(
  href: string | null | undefined,
): boolean {
  const raw = (href || "").trim();
  if (!raw) return false;
  if (registerYourMapSiteFastCodeFromPath(raw)) return true;
  try {
    const url = new URL(raw, "https://talispros.local");
    if (registerYourMapSiteFastCodeFromPath(url.pathname)) return true;
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "") return true;
    // Absolute homepage hosts without a deeper path.
    if (
      (url.hostname === "talispros.com" ||
        url.hostname === "www.talispros.com" ||
        url.hostname === "talispros.local") &&
      (path === "/" || path === "")
    ) {
      return true;
    }
  } catch {
    if (raw === "/" || raw === "") return true;
  }
  return false;
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
