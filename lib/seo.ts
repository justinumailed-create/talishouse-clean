import type { Metadata } from "next";

const SITE_URL = "https://www.talishouse.com";
const SITE_NAME = "Talispros™";
/** Static WhatsApp / Open Graph preview (1200×630). */
const OG_IMAGE = "/seo/talispros-og.jpg";

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
  /** Absolute or site-relative Open Graph / WhatsApp preview image. */
  image?: string | CreateMetadataImage;
}): Metadata {
  const url = `${SITE_URL}${overrides.path}`;
  const image =
    typeof overrides.image === "string"
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
            width: 579,
            height: 1024,
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
    alternates: { canonical: url },
    openGraph: {
      title: overrides.title,
      description: overrides.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
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
