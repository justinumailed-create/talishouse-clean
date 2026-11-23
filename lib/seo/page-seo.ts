import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import {
  localeAlternates,
  localizedUrl,
  ogAlternateLocales,
  ogLocale,
} from "@/lib/i18n/metadata";
import data from "./pages.json";

/**
 * Page-specific SEO for every route: own title and description in EN and DE.
 * Every page shares one Open Graph / Twitter image, the Windswept tree logo
 * on white with the Tsplits™ wordmark (`public/og/tsplits-windswept.jpg`).
 * Canonical and og:url always use https://www.tsplits.com.
 *
 * Copy lives in ./pages.json. Internal admin/agent pages share the same
 * image, use "Tsplits™ Admin" titles, and are noindex.
 */

export const PAGE_SEO_SITE_URL = "https://www.tsplits.com";
export const TSPLITS_OG_IMAGE_PATH = "/og/tsplits-windswept.jpg";
export const TSPLITS_OG_IMAGE_URL = `${PAGE_SEO_SITE_URL}${TSPLITS_OG_IMAGE_PATH}`;
export const TSPLITS_OG_IMAGE_ALT = "Tsplits™ Windswept tree logo";

type LocaleCopy = { title: string; description: string; alt: string };
export type PageSeoEntry = {
  kind: "public" | "login" | "utility" | "dynamic" | "custom";
  noindex?: boolean;
  image?: string;
  en?: LocaleCopy;
  de?: LocaleCopy;
};

export const PAGE_SEO = data.pages as Record<string, PageSeoEntry>;
const ADMIN_SEO = data.admin as {
  image: string;
  en: LocaleCopy;
  de: LocaleCopy;
};

export type PageSeoRoute = keyof typeof data.pages;

/** Shared Windswept share-card path. Locale arguments are ignored. */
export function pageOgImagePath(image?: string, locale?: Locale): string {
  void image;
  void locale;
  return TSPLITS_OG_IMAGE_PATH;
}

function ogImage(alt = TSPLITS_OG_IMAGE_ALT) {
  return {
    url: TSPLITS_OG_IMAGE_URL,
    width: 1200,
    height: 630,
    alt,
  };
}

function build(input: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  alt?: string;
  noindex: boolean;
  siteName?: string;
}): Metadata {
  const url =
    input.path === "/" ? PAGE_SEO_SITE_URL : `${PAGE_SEO_SITE_URL}${input.path}`;
  const image = ogImage(input.alt ?? TSPLITS_OG_IMAGE_ALT);
  return {
    metadataBase: new URL(PAGE_SEO_SITE_URL),
    title: input.title,
    description: input.description,
    alternates: localeAlternates(url, input.locale),
    openGraph: {
      title: input.title,
      description: input.description,
      url: localizedUrl(url, input.locale),
      siteName: input.siteName ?? "Tsplits™",
      type: "website",
      locale: ogLocale(input.locale),
      alternateLocale: ogAlternateLocales(input.locale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [{ url: image.url, alt: image.alt }],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

/** Metadata for a registered fixed route (see pages.json). */
export function buildPageMetadata(
  route: PageSeoRoute,
  locale: Locale,
): Metadata {
  const entry = PAGE_SEO[route];
  const copy = entry?.[locale];
  if (!entry || !copy) {
    throw new Error(`No page SEO registered for ${route}`);
  }
  return build({
    title: copy.title,
    description: copy.description,
    path: route,
    locale,
    noindex: Boolean(entry.noindex),
    siteName: "Tsplits™",
  });
}

/** Shared noindex "Tsplits™ Admin" metadata for internal pages. */
export function buildAdminMetadata(
  locale: Locale,
  title?: string,
  path = "/admin",
): Metadata {
  const copy = ADMIN_SEO[locale];
  return build({
    title: title ? `${title} | Tsplits™ Admin` : copy.title,
    description: copy.description,
    path,
    locale,
    noindex: true,
  });
}

/**
 * Per-record pages (individual Mapsites, books): name-based title and
 * description, always with the shared Windswept share card.
 */
export function buildDynamicMetadata(input: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  /** Ignored: every page uses the shared Windswept card. */
  image?: string;
  alt?: string;
  noindex?: boolean;
}): Metadata {
  return build({
    title: input.title,
    description: input.description,
    path: input.path,
    locale: input.locale,
    noindex: Boolean(input.noindex),
  });
}
