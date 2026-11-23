import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
  ogAlternateLocales,
  ogLocale,
} from "@/lib/i18n/metadata";
import {
  PAGE_SEO_SITE_URL,
  TSPLITS_OG_IMAGE_ALT,
  TSPLITS_OG_IMAGE_URL,
} from "@/lib/seo/page-seo";

const SITE_URL = PAGE_SEO_SITE_URL;
const SITE_NAME = "Tsplits™";
/**
 * Sitewide Open Graph / Twitter preview: the shared Windswept tree logo
 * on white with the Tsplits™ wordmark. Per-page and /api/og cards are not used.
 */
const OG_IMAGE = TSPLITS_OG_IMAGE_URL;

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  ogImage: OG_IMAGE,
  keywords: [
    "tsplits",
    "mapsites",
    "real estate marketing",
    "referral networks",
    "co promotion",
    "industry adjacent marketplaces",
    "real estate lead generation",
    "fast codes",
    "partner access",
    "real estate technology",
  ],
};

export type CreateMetadataImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export function createMetadata(overrides: {
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
   * Open Graph / Twitter preview image.
   * Ignored: every page uses the shared Windswept card. The argument is
   * kept so existing callers compile without change.
   */
  image?: string | CreateMetadataImage | false;
}): Metadata {
  const url = `${SITE_URL}${overrides.path}`;
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
    keywords: siteConfig.keywords,
    alternates: overrides.locale
      ? localeAlternates(url, overrides.locale)
      : { canonical: url },
    openGraph: {
      title: overrides.title,
      description: overrides.description,
      url,
      siteName: SITE_NAME,
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
      images: [image.url],
    },
    robots,
  };
}
