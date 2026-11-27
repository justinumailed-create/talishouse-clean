/**
 * Click-to-reveal lookup for public personal-home and Mapsite contact
 * details. Phone numbers and emails are not included in the first HTML or
 * RSC payload. This module also holds the in-memory per-IP rate limiter
 * (no production database changes).
 */

export const PERSONAL_HOME_CONTACT_FIELDS = ["phone", "email"] as const;
export type PersonalHomeContactField = (typeof PERSONAL_HOME_CONTACT_FIELDS)[number];

export const PERSONAL_HOME_CONTACT_SURFACES = ["home", "mapsite"] as const;
export type PersonalHomeContactSurface =
  (typeof PERSONAL_HOME_CONTACT_SURFACES)[number];

export const CONTACT_REVEAL_WINDOW_MS = 10 * 60 * 1000;
export const CONTACT_REVEAL_MAX_PER_IP = 30;
export const CONTACT_REVEAL_CODE_MAX = 64;

const hitsByIp = new Map<string, number[]>();

export function resetContactRevealRateLimitForTests(): void {
  hitsByIp.clear();
}

export function requestClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** True when the request may proceed. False when the IP is over the limit. */
export function allowContactReveal(ip: string, now = Date.now()): boolean {
  const key = ip.trim() || "unknown";
  const recent = (hitsByIp.get(key) ?? []).filter(
    (at) => now - at < CONTACT_REVEAL_WINDOW_MS,
  );
  if (recent.length >= CONTACT_REVEAL_MAX_PER_IP) {
    hitsByIp.set(key, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(key, recent);
  return true;
}

export function isSameOriginRequest(request: Request): boolean {
  const host = new URL(request.url).host;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin";
}

export type ContactRevealInput = {
  code: string;
  field: PersonalHomeContactField;
  surface: PersonalHomeContactSurface;
};

export function parseContactRevealBody(body: unknown): ContactRevealInput | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const code =
    typeof raw.code === "string"
      ? raw.code.trim().toLowerCase()
      : typeof raw.fastCode === "string"
        ? raw.fastCode.trim().toLowerCase()
        : typeof raw.slug === "string"
          ? raw.slug.trim().toLowerCase()
          : "";
  if (!code || code.length > CONTACT_REVEAL_CODE_MAX) return null;
  const field = raw.field;
  if (field !== "phone" && field !== "email") return null;
  const surfaceRaw = raw.surface;
  const surface: PersonalHomeContactSurface =
    surfaceRaw === "mapsite" ? "mapsite" : "home";
  return { code, field, surface };
}
