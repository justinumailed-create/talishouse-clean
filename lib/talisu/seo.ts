import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
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
}): Metadata {
  const path = overrides.path.startsWith("/")
    ? overrides.path
    : `/${overrides.path}`;
  const url = `${TALISU_SITE_URL}${path}`;
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
      url,
      siteName: "TalisU™",
      type: "website",
      locale: ogLocale(overrides.locale ?? "en"),
      ...(overrides.locale
        ? { alternateLocale: ogAlternateLocales(overrides.locale) }
        : {}),
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: overrides.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: overrides.title,
      description: overrides.description,
      images: [OG_IMAGE],
    },
    robots,
  };
}
