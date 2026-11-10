import {
  buildSystemEbook,
  systemEbookLackedListingsMessage,
  type SystemEbookDocument,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";
import { approvedSystemEbookProfile } from "@/lib/talisbooks/system-ebook-previews";
import {
  copyAcceptedListingPhotos,
  enrichProfileFromWebsite,
  isPlaceholderBrandImage,
  logoNeedsDarkPlate,
} from "@/lib/talisbooks/system-ebook-sources";

/** Read the brokerage site, then build the standard book. Does not write a row unless storePhotos is set. */
export async function composeStandardSystemEbook(
  profile: SystemEbookProfile,
  options?: { storePhotos?: boolean },
): Promise<SystemEbookDocument> {
  const enriched = await enrichProfileFromWebsite(profile);
  const approved = approvedSystemEbookProfile(profile.fastCode);
  const extractedListingCount = enriched.extractedListingCount ?? enriched.listings?.length ?? 0;
  const liveLogo = enriched.logoUrl?.trim() || "";
  const logoUrl =
    liveLogo && !isPlaceholderBrandImage(liveLogo)
      ? liveLogo
      : approved?.logoUrl || liveLogo || null;
  const listings = options?.storePhotos
    ? await copyAcceptedListingPhotos(profile.fastCode, enriched.listings ?? [])
    : enriched.listings;
  const townPhoto = (enriched.townPhotoUrls ?? []).map((url) => url.trim()).find(Boolean) || "";
  const areaPhotoUrl =
    enriched.areaPhotoUrl?.trim() ||
    townPhoto ||
    approved?.areaPhotoUrl ||
    approved?.coverMapUrl ||
    null;
  const areaPhotoFit =
    enriched.areaPhotoUrl?.trim() || townPhoto
      ? enriched.areaPhotoFit
      : approved?.areaPhotoFit;
  const logoPlate = (await logoNeedsDarkPlate(logoUrl)) ? "dark" : enriched.logoPlate || approved?.logoPlate || "light";
  const brokerName = enriched.brokerName?.trim() || approved?.brokerName || "";
  const areas = enriched.areas?.length
    ? enriched.areas
    : (listings?.length ? [] : approved?.areas) ?? [];
  const document = buildSystemEbook({
    ...enriched,
    listings,
    logoUrl,
    logoPlate,
    brokerName,
    areas,
    areaPhotoUrl,
    areaPhotoFit: areaPhotoFit ?? undefined,
    marketMapUrl: enriched.marketMapUrl || approved?.marketMapUrl || null,
  });
  if (document.lackedListings) {
    console.warn(systemEbookLackedListingsMessage(profile.fastCode));
  }
  return {
    ...document,
    extractedListingCount,
    usedApprovedPreview: false,
  };
}
