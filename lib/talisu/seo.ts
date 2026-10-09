import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
  localizedUrl,
  ogAlternateLocales,
  ogLocale,
} from "@/lib/i18n/metadata";
import { TALISU_SITE_URL } from "@/lib/talisu/content";

const OG_IMAGE = "https://www.talispros.com/api/og/talispros";

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
   * Page-specific Open Graph / Twitter image (absolute URL or root-relative
   * path under /public). Defaults to the shared Talispros brand card.
   */
  image?: { url: string; width?: number; height?: number; alt?: string };
}): Metadata {
  const path = overrides.path.startsWith("/")
    ? overrides.path
    : `/${overrides.path}`;
  const url = `${TALISU_SITE_URL}${path}`;
  const ogUrl = overrides.locale
    ? localizedUrl(url, overrides.locale)
    : url;
  const imageUrl = overrides.image
    ? overrides.image.url.startsWith("http")
      ? overrides.image.url
      : `${TALISU_SITE_URL}${overrides.image.url}`
    : OG_IMAGE;
  const image = {
    url: imageUrl,
    width: overrides.image?.width ?? 1200,
    height: overrides.image?.height ?? 630,
    alt: overrides.image?.alt ?? overrides.title,
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
    metadataBase: new URL(TALISU_SITE_URL),
    title: overrides.title,
    description: overrides.description,
    alternates: overrides.locale
      ? localeAlternates(url, overrides.locale)
      : { canonical: url },
    openGraph: {
      title: overrides.title,
      description: overrides.description,
      url: ogUrl,
      siteName: "TalisU™",
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
