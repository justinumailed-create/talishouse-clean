import {
  buildSystemEbook,
  systemEbookLackedListingsMessage,
  type SystemEbookDocument,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";
import { approvedSystemEbookProfile } from "@/lib/talisbooks/system-ebook-previews";
import {
  enrichProfileFromWebsite,
  isPlaceholderBrandImage,
} from "@/lib/talisbooks/system-ebook-sources";

/** Read the brokerage site, then build the standard book. Does not write a row. */
export async function composeStandardSystemEbook(
  profile: SystemEbookProfile,
): Promise<SystemEbookDocument> {
  const enriched = await enrichProfileFromWebsite(profile);
  const approved = approvedSystemEbookProfile(profile.fastCode);
  const extractedListingCount = enriched.extractedListingCount ?? enriched.listings?.length ?? 0;
  const liveLogo = enriched.logoUrl?.trim() || "";
  const logoUrl =
    liveLogo && !isPlaceholderBrandImage(liveLogo)
      ? liveLogo
      : approved?.logoUrl || liveLogo || null;
  const document = buildSystemEbook({ ...enriched, logoUrl });
  if (document.lackedListings) {
    console.warn(systemEbookLackedListingsMessage(profile.fastCode));
  }
  return {
    ...document,
    extractedListingCount,
    usedApprovedPreview: false,
  };
}
