import {
  loadMapSiteOwnerCustomizations,
  loadMapSiteOwnerCustomizationsByFastCode,
} from "@/lib/talispros/mapsite-owner-customizations-service";
import {
  mapsiteBrandingOgVersion,
  resolveMapSiteLogoUrl,
  type MapSiteBrandingOverrides,
} from "@/lib/talispros/mapsite-branding";
import { resolveMapSiteOgImage } from "@/lib/talispros/mapsite-og-image";

/**
 * Server entry points for owner branding. Load overrides once, then pass them
 * to the pure resolver in mapsite-branding.ts. Never throws (empty overrides).
 */
export async function loadMapSiteBrandingOverrides(input: {
  mapsiteId?: string | null;
  fastCode?: string | null;
}): Promise<MapSiteBrandingOverrides> {
  if (input.mapsiteId?.trim()) {
    const byId = await loadMapSiteOwnerCustomizations(input.mapsiteId);
    if (byId.logoUrl || byId.partnerImageUrl || byId.partnerName || byId.partnerTagline) {
      return byId;
    }
    if (!input.fastCode?.trim()) return byId;
  }
  return loadMapSiteOwnerCustomizationsByFastCode(input.fastCode);
}

/** Effective logo for a Mapsite™ (owner override, else the stored default). */
export async function resolveMapSiteLogoUrlForServer(input: {
  mapsiteId?: string | null;
  fastCode?: string | null;
  defaultLogoUrl: string | null | undefined;
}): Promise<string | null> {
  const overrides = await loadMapSiteBrandingOverrides(input);
  return resolveMapSiteLogoUrl(input.defaultLogoUrl, overrides);
}

/** og:image URL for a Mapsite™, versioned when the owner has a custom logo. */
export async function resolveBrandedMapSiteOgImage(fastCode: string): Promise<string> {
  const overrides = await loadMapSiteBrandingOverrides({ fastCode });
  return resolveMapSiteOgImage(fastCode, mapsiteBrandingOgVersion(overrides));
}
