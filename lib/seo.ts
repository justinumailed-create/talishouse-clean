import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
  ogAlternateLocales,
  ogLocale,
} from "@/lib/i18n/metadata";

const SITE_URL = "https://www.talishouse.com";
const SITE_NAME = "Talispros™";
/**
 * Sitewide default Open Graph / Twitter preview when a page omits `image`.
 * Must be the composed homepage brand card (logo+partner+map) — never the
 * oversized standalone /logo.png or /seo/talispros-og.jpg poster.
 */
const OG_IMAGE = "https://www.talispros.com/api/og/talispros";

export const siteConfig = {
  url: SITE_URL,
  name: SITE_NAME,
  ogImage: OG_IMAGE,
  keywords: [
    "talispros",
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
   * Pass `false` to omit images (title + description only).
   */
  image?: string | CreateMetadataImage | false;
}): Metadata {
  const url = `${SITE_URL}${overrides.path}`;
  const omitImage = overrides.image === false;
  const image = omitImage
    ? null
    : typeof overrides.image === "string"
      ? {
          url: overrides.image,
          width: 1200,
          height: 630,
          alt: overrides.title,
        }
      : overrides.image
        ? {
            url: overrides.image.url,
            width: overrides.image.width ?? 1200,
            height: overrides.image.height ?? 630,
            alt: overrides.image.alt ?? overrides.title,
          }
        : {
            url: OG_IMAGE,
            width: 1200,
            height: 630,
            alt: overrides.title,
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
      ...(omitImage ? { images: [] } : { images: [image!] }),
    },
    twitter: omitImage
      ? {
          card: "summary",
          title: overrides.title,
          description: overrides.description,
        }
      : {
          card: "summary_large_image",
          title: overrides.title,
          description: overrides.description,
          images: [image!.url],
        },
    robots,
  };
}
