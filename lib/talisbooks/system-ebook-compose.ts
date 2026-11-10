import {
  buildSystemEbook,
  systemEbookLackedListingsMessage,
  type SystemEbookDocument,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";
import { approvedSystemEbookProfile } from "@/lib/talisbooks/system-ebook-previews";
import { enrichProfileFromWebsite } from "@/lib/talisbooks/system-ebook-sources";

/** Read the brokerage site, then build the standard book. Does not write a row. */
export async function composeStandardSystemEbook(
  profile: SystemEbookProfile,
): Promise<SystemEbookDocument> {
  const enriched = await enrichProfileFromWebsite(profile);
  const approved = approvedSystemEbookProfile(profile.fastCode);
  const extractedListingCount = enriched.extractedListingCount ?? enriched.listings?.length ?? 0;
  const merged: SystemEbookProfile = approved
    ? {
        ...enriched,
        listings: approved.listings,
        areas: approved.areas ?? enriched.areas,
        areaPhotoUrl: enriched.townPhotoUrls?.length ? enriched.areaPhotoUrl : approved.areaPhotoUrl,
        areaPhotoFit: approved.areaPhotoFit ?? enriched.areaPhotoFit,
        coverMapUrl: approved.coverMapUrl ?? enriched.coverMapUrl,
        areaMapUrl: approved.areaMapUrl ?? enriched.areaMapUrl,
        marketMapUrl: approved.marketMapUrl ?? enriched.marketMapUrl,
        logoPlate: approved.logoPlate ?? enriched.logoPlate,
        logoUrl: enriched.logoUrl || approved.logoUrl,
      }
    : enriched;
  const document = buildSystemEbook(merged);
  if (document.lackedListings) {
    console.warn(systemEbookLackedListingsMessage(profile.fastCode));
  }
  return {
    ...document,
    extractedListingCount,
    usedApprovedPreview: Boolean(approved?.listings?.length),
  };
}
