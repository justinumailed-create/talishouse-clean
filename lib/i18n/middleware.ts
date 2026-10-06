import type { NextResponse } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  readLocaleQuery,
  type Locale,
} from "@/lib/i18n/config";

/**
 * `?lang=de|en` → forward as a request header (so this render uses it) and
 * persist it in the locale cookie (so the next clean URL keeps it).
 */
export function localeFromRequestUrl(url: URL): Locale | null {
  return readLocaleQuery(url.searchParams);
}

export function withLocaleRequestHeader(
  headers: Headers,
  locale: Locale | null,
): Headers {
  if (locale) headers.set(LOCALE_HEADER, locale);
  return headers;
}

export function persistLocaleCookie<T extends NextResponse>(
  response: T,
  locale: Locale | null,
): T {
  if (locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}
