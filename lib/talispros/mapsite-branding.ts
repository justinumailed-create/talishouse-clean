/**
 * Single resolver for a Mapsite's owner branding (logo, left-card partner
 * photo, partner name, partner tagline).
 *
 * Every surface that shows a Mapsite logo or the left-card partner details
 * must go through `resolveMapSiteBranding` / `resolveMapSiteLogoUrl` so the
 * owner overrides in `mapsite_owner_customizations` win everywhere and
 * "Reset to default" (override = null) falls back to the stored defaults.
 * The base `mapsites.logo_url` is never rewritten by an override.
 */
import type { MapSiteOwnerCustomizations } from "@/lib/talispros/mapsite-owner-customizations";

export type MapSiteBrandingOverrides = Partial<
  Pick<
    MapSiteOwnerCustomizations,
    "logoUrl" | "partnerImageUrl" | "partnerName" | "partnerTagline" | "updatedAt"
  >
> | null;

export type MapSiteBrandingDefaults = {
  logoUrl: string | null;
  partnerImageUrl: string;
  partnerName: string;
  partnerTagline: string;
};

export type ResolvedMapSiteBranding = MapSiteBrandingDefaults & {
  overridden: {
    logo: boolean;
    partnerImage: boolean;
    partnerName: boolean;
    partnerTagline: boolean;
  };
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Owner logo override, else the Mapsite default logo (may be null). */
export function resolveMapSiteLogoUrl(
  defaultLogoUrl: string | null | undefined,
  overrides: MapSiteBrandingOverrides | undefined,
): string | null {
  return clean(overrides?.logoUrl) || clean(defaultLogoUrl);
}

export function resolveMapSiteBranding(
  defaults: MapSiteBrandingDefaults,
  overrides: MapSiteBrandingOverrides | undefined,
): ResolvedMapSiteBranding {
  const logo = clean(overrides?.logoUrl);
  const partnerImage = clean(overrides?.partnerImageUrl);
  const partnerName = clean(overrides?.partnerName);
  const partnerTagline = clean(overrides?.partnerTagline);
  return {
    logoUrl: logo || clean(defaults.logoUrl),
    partnerImageUrl: partnerImage || defaults.partnerImageUrl,
    partnerName: partnerName || defaults.partnerName,
    partnerTagline: partnerTagline || defaults.partnerTagline,
    overridden: {
      logo: Boolean(logo),
      partnerImage: Boolean(partnerImage),
      partnerName: Boolean(partnerName),
      partnerTagline: Boolean(partnerTagline),
    },
  };
}

/** Apply the logo override to any record shaped like `{ logo_url }`. */
export function withOwnerLogo<T extends { logo_url: string | null }>(
  record: T,
  overrides: MapSiteBrandingOverrides | undefined,
): T {
  const logo = clean(overrides?.logoUrl);
  return logo ? { ...record, logo_url: logo } : record;
}

/** Apply the logo override to any view shaped like `{ logoUrl }`. */
export function withOwnerLogoUrl<T extends { logoUrl: string | null }>(
  view: T,
  overrides: MapSiteBrandingOverrides | undefined,
): T {
  const logo = clean(overrides?.logoUrl);
  return logo ? { ...view, logoUrl: logo } : view;
}

/**
 * Cache-busting version for the Mapsite Open Graph card URL. Only set when an
 * owner logo override exists, so default cards keep their stable URL.
 */
export function mapsiteBrandingOgVersion(
  overrides: MapSiteBrandingOverrides | undefined,
): string | null {
  if (!clean(overrides?.logoUrl)) return null;
  const stamp = overrides?.updatedAt ? Date.parse(overrides.updatedAt) : NaN;
  return Number.isFinite(stamp) ? String(Math.floor(stamp / 1000)) : "1";
}
