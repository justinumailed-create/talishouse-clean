import {
  buildSystemEbook,
  systemEbookLackedListingsMessage,
  type SystemEbookDocument,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";
import { enrichProfileFromWebsite } from "@/lib/talisbooks/system-ebook-sources";

/** Read the brokerage site, then build the standard book. Does not write a row. */
export async function composeStandardSystemEbook(
  profile: SystemEbookProfile,
): Promise<SystemEbookDocument> {
  const enriched = await enrichProfileFromWebsite(profile);
  const document = buildSystemEbook(enriched);
  if (document.lackedListings) {
    console.warn(systemEbookLackedListingsMessage(profile.fastCode));
  }
  return document;
}
