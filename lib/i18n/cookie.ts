import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HTML_LANG,
  LOCALE_QUERY_PARAM,
  type Locale,
} from "@/lib/i18n/config";

/** `document.cookie` assignment string for the chosen locale. */
export function buildLocaleCookie(locale: Locale, secure = false): string {
  return [
    `${LOCALE_COOKIE}=${locale}`,
    "path=/",
    `max-age=${LOCALE_COOKIE_MAX_AGE}`,
    "samesite=lax",
    ...(secure ? ["secure"] : []),
  ].join("; ");
}

type CookieDocument = {
  cookie: string;
  documentElement: { lang: string };
  location?: { protocol?: string };
};

/**
 * Client side of the EN | DE switch: persists the cookie and updates
 * `<html lang>` immediately (the server re-renders on refresh).
 */
export function persistLocale(locale: Locale, doc: CookieDocument): void {
  const secure = doc.location?.protocol === "https:";
  doc.cookie = buildLocaleCookie(locale, secure);
  doc.documentElement.lang = LOCALE_HTML_LANG[locale];
}

/**
 * After switching, drop a `?lang=` override from the current URL so the
 * cookie choice is what the server reads. Returns null when nothing changes.
 */
export function stripLocaleQuery(href: string): string | null {
  const url = new URL(href, "http://local.invalid");
  if (!url.searchParams.has(LOCALE_QUERY_PARAM)) return null;
  url.searchParams.delete(LOCALE_QUERY_PARAM);
  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}
