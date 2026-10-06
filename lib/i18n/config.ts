/**
 * Site UI locales (English default, hand-written German).
 *
 * Approach: no `/[locale]` route segment. The active locale comes from
 *   1. `?lang=de|en` (crawlable alternate URL; middleware forwards it as a
 *      request header and persists it in the cookie), then
 *   2. the `talis_locale` cookie set by the EN | DE navbar switch, then
 *   3. English.
 * Existing routes, redirects, FAST Code Mapsite URLs and SamCart links are
 * untouched.
 */
export const LOCALES = ["en", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie written by the language switch (1 year, path=/). */
export const LOCALE_COOKIE = "talis_locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Query param for crawlable language alternates (`/talisu?lang=de`). */
export const LOCALE_QUERY_PARAM = "lang";

/** Request header middleware sets when `?lang=` is present. */
export const LOCALE_HEADER = "x-talis-locale";

/** BCP-47 tags for `<html lang>` / hreflang. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  de: "de",
};

/** Open Graph locale tags. */
export const LOCALE_OG: Record<Locale, string> = {
  en: "en_US",
  de: "de_DE",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Normalizes a cookie / header / query value; unknown values fall back to English. */
export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const v = value.trim().toLowerCase().slice(0, 2);
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** Returns the locale named by `?lang=`, or null when absent / unknown. */
export function readLocaleQuery(
  searchParams: URLSearchParams | { get(name: string): string | null },
): Locale | null {
  const raw = searchParams.get(LOCALE_QUERY_PARAM);
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return isLocale(v) ? v : null;
}
