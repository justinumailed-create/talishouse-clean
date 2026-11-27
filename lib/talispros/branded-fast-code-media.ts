import type { Metadata } from "next";
import { PAGE_SEO_SITE_URL } from "@/lib/seo/page-seo";

/** Case-insensitive FAST codes that use the owner's homepage image as the Open Graph / Twitter preview. Not site-wide. */
export const BRANDED_FAST_CODE_HOME_MEDIA_CODES = ["rm22", "dc06"] as const;

export type BrandedFastCodeHomeMediaCode =
  (typeof BRANDED_FAST_CODE_HOME_MEDIA_CODES)[number];

export function normalizeFastCodeKey(code: string | null | undefined): string {
  return code?.trim().toLowerCase() || "";
}

export function isBrandedFastCodeHomeMedia(
  code: string | null | undefined,
): boolean {
  const key = normalizeFastCodeKey(code);
  return (BRANDED_FAST_CODE_HOME_MEDIA_CODES as readonly string[]).includes(key);
}

export function brandedFastCodeOgPath(code: string): string {
  return `/api/og/fast-code-home/${encodeURIComponent(normalizeFastCodeKey(code))}`;
}

export function brandedFastCodeOgUrl(code: string): string {
  return `${PAGE_SEO_SITE_URL}${brandedFastCodeOgPath(code)}`;
}

export function applyBrandedFastCodeShareMetadata(
  metadata: Metadata,
  input: {
    fastCode: string;
    homeImageUrl?: string | null;
    alt: string;
  },
): Metadata {
  const home = input.homeImageUrl?.trim() || "";
  if (!isBrandedFastCodeHomeMedia(input.fastCode) || !home) {
    return metadata;
  }

  const ogUrl = brandedFastCodeOgUrl(input.fastCode);
  const alt = input.alt.trim() || "Homepage image";

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url: ogUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      ...metadata.twitter,
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}
