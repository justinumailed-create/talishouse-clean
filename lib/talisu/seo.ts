import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
  localizedUrl,
  ogAlternateLocales,
  ogLocale,
} from "@/lib/i18n/metadata";
import {
  PAGE_SEO_SITE_URL,
  TSPLITS_OG_IMAGE_ALT,
  TSPLITS_OG_IMAGE_URL,
} from "@/lib/seo/page-seo";

const SITE_URL = PAGE_SEO_SITE_URL;
const OG_IMAGE = TSPLITS_OG_IMAGE_URL;

export function createTalisUMetadata(overrides: {
  title: string;
  description: string;
  path: string;
  private?: boolean;
  /**
   * Translated page: emit canonical for this locale plus en/de/x-default
   * hreflang alternates (German = `?lang=de`). Omit on English-only pages.
   */
  locale?: Locale;
  /**
   * Ignored: every page uses the shared Windswept Tsplits™ card.
   */
  image?: { url: string; width?: number; height?: number; alt?: string };
}): Metadata {
  const path = overrides.path.startsWith("/")
    ? overrides.path
    : `/${overrides.path}`;
  const url = `${SITE_URL}${path}`;
  const ogUrl = overrides.locale
    ? localizedUrl(url, overrides.locale)
    : url;
  const image = {
    url: OG_IMAGE,
    width: 1200,
    height: 630,
    alt: TSPLITS_OG_IMAGE_ALT,
  };
  const robots = overrides.private
    ? { index: false as const, follow: false as const }
    : {
        index: true as const,
        follow: true as const,
        googleBot: {
          index: true as const,
          follow: true as const,
          "max-video-preview": -1 as const,
          "max-image-preview": "large" as const,
          "max-snippet": -1 as const,
        },
      };

  return {
    metadataBase: new URL(SITE_URL),
    title: overrides.title,
    description: overrides.description,
    alternates: overrides.locale
      ? localeAlternates(url, overrides.locale)
      : { canonical: url },
    openGraph: {
      title: overrides.title,
      description: overrides.description,
      url: ogUrl,
      siteName: "Tsplits™",
      type: "website",
      locale: ogLocale(overrides.locale ?? "en"),
      ...(overrides.locale
        ? { alternateLocale: ogAlternateLocales(overrides.locale) }
        : {}),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: overrides.title,
      description: overrides.description,
      images: [{ url: image.url, alt: image.alt }],
    },
    robots,
  };
}
