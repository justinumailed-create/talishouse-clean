import type { Metadata } from "next";
import {
  LOCALE_HTML_LANG,
  LOCALE_OG,
  LOCALE_QUERY_PARAM,
  type Locale,
} from "@/lib/i18n/config";

/** Absolute URL of `url` in `locale` (English = clean URL, German = `?lang=de`). */
export function localizedUrl(url: string, locale: Locale): string {
  if (locale === "en") return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${LOCALE_QUERY_PARAM}=${locale}`;
}

/** canonical + hreflang alternates (en, de, x-default) for an absolute page URL. */
export function localeAlternates(
  url: string,
  locale: Locale,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localizedUrl(url, locale),
    languages: {
      [LOCALE_HTML_LANG.en]: localizedUrl(url, "en"),
      [LOCALE_HTML_LANG.de]: localizedUrl(url, "de"),
      "x-default": url,
    },
  };
}

export function ogLocale(locale: Locale): string {
  return LOCALE_OG[locale];
}

export function ogAlternateLocales(locale: Locale): string[] {
  return (Object.keys(LOCALE_OG) as Locale[])
    .filter((l) => l !== locale)
    .map((l) => LOCALE_OG[l]);
}
