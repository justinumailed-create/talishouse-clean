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
 * Page-specific SEO for every route (Arun's standing rule): own title,
 * description and a dedicated 1200×630 share card in EN and DE.
 *
 * Copy + card design live in scripts/og/pages_src.py; `python3
 * scripts/og/generate.py` renders public/og/pages/<slug>-<locale>.jpg and
 * writes ./pages.json. Static JPGs only, so no OG route reads the filesystem.
 * Internal admin/agent pages share one "Talispros™ Admin" card and are noindex.
 */

export const PAGE_SEO_SITE_URL = "https://www.talispros.com";

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

/** Root-relative share card path for a page in a locale. */
export function pageOgImagePath(image: string, locale: Locale): string {
  return `${image}-${locale}.jpg`;
}

function build(input: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image: string;
  alt: string;
  noindex: boolean;
  siteName?: string;
}): Metadata {
  const url =
    input.path === "/" ? PAGE_SEO_SITE_URL : `${PAGE_SEO_SITE_URL}${input.path}`;
  const imageUrl = `${PAGE_SEO_SITE_URL}${input.image}`;
  const image = { url: imageUrl, width: 1200, height: 630, alt: input.alt };
  return {
    metadataBase: new URL(PAGE_SEO_SITE_URL),
    title: input.title,
    description: input.description,
    alternates: localeAlternates(url, input.locale),
    openGraph: {
      title: input.title,
      description: input.description,
      url: localizedUrl(url, input.locale),
      siteName: input.siteName ?? "Talispros™",
      type: "website",
      locale: ogLocale(input.locale),
      alternateLocale: ogAlternateLocales(input.locale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [{ url: imageUrl, alt: input.alt }],
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
  if (!entry?.image || !copy) {
    throw new Error(`No page SEO registered for ${route}`);
  }
  return build({
    ...copy,
    path: route,
    locale,
    image: pageOgImagePath(entry.image, locale),
    noindex: Boolean(entry.noindex),
    siteName: route.startsWith("/talisu") ? "TalisU™" : undefined,
  });
}

/** Shared noindex "Talispros™ Admin" metadata for internal pages. */
export function buildAdminMetadata(
  locale: Locale,
  title?: string,
  path = "/admin",
): Metadata {
  const copy = ADMIN_SEO[locale];
  return build({
    title: title ? `${title} | Talispros™ Admin` : copy.title,
    description: copy.description,
    path,
    locale,
    image: pageOgImagePath(ADMIN_SEO.image, locale),
    alt: copy.alt,
    noindex: true,
  });
}

/**
 * Per-record pages (individual Mapsites, books): name-based title with a
 * generated share card (e.g. /api/og/mapsite/<code>).
 */
export function buildDynamicMetadata(input: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  /** Absolute URL or root-relative path of the generated 1200×630 card. */
  image: string;
  alt?: string;
  noindex?: boolean;
}): Metadata {
  const meta = build({
    title: input.title,
    description: input.description,
    path: input.path,
    locale: input.locale,
    image: input.image,
    alt: input.alt ?? input.title,
    noindex: Boolean(input.noindex),
  });
  if (/^https?:\/\//.test(input.image)) {
    const image = { url: input.image, width: 1200, height: 630, alt: input.alt ?? input.title };
    meta.openGraph = { ...meta.openGraph, images: [image] };
    meta.twitter = { ...meta.twitter, images: [{ url: image.url, alt: image.alt }] };
  }
  return meta;
}
