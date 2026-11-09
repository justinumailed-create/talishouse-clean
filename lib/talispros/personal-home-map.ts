import "server-only";

import { loadMapSiteApplicationState } from "@/app/talispros/mapsite/actions";
import {
  getMapSiteEbookContext,
  resolveEbookListingImageUrls,
} from "@/lib/talisbooks/mapsite-ebook-service";
import { loadOwnTebViewerHref } from "@/lib/talisbooks/own-teb-href";
import { withEbookListingMedia } from "@/lib/talispros/mapsite-listing-media";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { DEMO_MAPSITE_ID } from "@/lib/talispros/mapsite-state";
import type { MapsiteFlagIdentity } from "@/lib/talispros/flag-identity";

export type PersonalHomeMapModel = {
  mapsite: MapSitePlatformRecord;
  flagIdentity: MapsiteFlagIdentity | null;
  flagName: string | null;
  hasTalisBook: boolean;
};

/**
 * This FAST Code's own Mapsite, for the personal-home left column.
 * Uses the office lat/lng on the Mapsite row and that code's own eBook.
 * Returns null when the only match would be the platform demonstration pin.
 */
export async function loadPersonalHomeMap(
  rawCode: string,
): Promise<PersonalHomeMapModel | null> {
  const code = rawCode.trim().toLowerCase();
  if (!code) return null;

  const mapsite = await loadMapSiteApplicationState({
    fastCode: code,
    claimed: true,
  });
  if (!mapsite?.id || !Number.isFinite(mapsite.lat) || !Number.isFinite(mapsite.lng)) {
    return null;
  }
  const savedCode = mapsite.fast_code?.trim().toLowerCase() || "";
  if (mapsite.id === DEMO_MAPSITE_ID && savedCode !== code) return null;

  const [ebook, tebOwnBookHref] = await Promise.all([
    getMapSiteEbookContext(code).catch(() => null),
    loadOwnTebViewerHref(code).catch(() => null),
  ]);
  const listingImageUrls = await resolveEbookListingImageUrls({
    listingImageUrls: ebook?.primaryEbook?.listingImageUrls,
    bookSlug: ebook?.primaryEbook?.slug,
    tebUrl: mapsite.teb_url,
  });
  const enriched = withEbookListingMedia(
    {
      ...mapsite,
      fast_code: mapsite.fast_code || code.toUpperCase(),
      teb_own_book_href: tebOwnBookHref,
      url1_opens_broker_url: true,
    },
    listingImageUrls,
  );

  return {
    mapsite: enriched,
    flagIdentity: ebook?.primaryEbook?.flagIdentity ?? null,
    flagName: ebook?.primaryEbook?.flagName ?? null,
    hasTalisBook: Boolean(
      tebOwnBookHref || enriched.teb_url || ebook?.books?.length || ebook?.primaryEbook,
    ),
  };
}
