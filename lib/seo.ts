import type { Metadata } from "next";

const SITE_URL = "https://www.talishouse.com";
const SITE_NAME = "Talispros™";
const OG_IMAGE = new URL("/api/og/talispros", SITE_URL).toString();

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

export function createMetadata(overrides: {
  title: string;
  description: string;
  path: string;
  private?: boolean;
}): Metadata {
  const url = `${SITE_URL}${overrides.path}`;
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
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
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
