/**
 * Claim vs Register vs Back for Talisbooks™ viewers and FAST shelves.
 *
 * - Register (SamCart): issued / claimed FAST Mapsite ebooks only
 * - Claim: demo Mapsite, demo ebook viewer, demo-* FAST shelves
 * - Back: all of the above except issued-FAST ebook viewers (Register only there)
 */

import { isDemonstrationCatalogBook, isDemonstrationFastCode } from "@/lib/talisbooks/library/demonstration-catalog";
import { PINNED_TALISBOOK_SLUG } from "@/lib/talisbooks/library/pinned-catalog";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { DEMO_MAPSITE_ID } from "@/lib/talispros/mapsite-state";
import { TALISU_REGISTER } from "@/lib/talisu/content";

export type TalisBooksSurfaceCta = "claim" | "register";

export const TALISBOOKS_SAMCART_REGISTER_URL = TALISU_REGISTER.samcartUrl;

export function isIssuedConnectedFastCode(
  fastCode: string | null | undefined,
): boolean {
  const code = fastCode?.trim() || "";
  if (!code) return false;
  return isIssuedFastCode(code) && !isDemonstrationFastCode(code);
}

/** Viewer / ebook page: Claim on demo; Register on issued connected FAST. */
export function talisBooksViewerCta(book: {
  fastCode?: string | null;
  slug?: string | null;
  id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  accountId?: string | null;
}): TalisBooksSurfaceCta {
  if (isIssuedConnectedFastCode(book.fastCode)) return "register";
  if (isDemonstrationCatalogBook(book)) return "claim";
  if (book.slug === PINNED_TALISBOOK_SLUG) return "claim";
  if (isDemonstrationFastCode(book.fastCode) || isDemoMapSiteCode(book.fastCode)) {
    return "claim";
  }
  // No issued FAST → treat as demonstration / pre-claim.
  return "claim";
}

/**
 * Back on demo viewers + shelves; never on issued-FAST ebook viewers
 * (those show Register only).
 */
export function talisBooksViewerShowBack(book: {
  fastCode?: string | null;
  slug?: string | null;
  id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  accountId?: string | null;
}): boolean {
  return talisBooksViewerCta(book) === "claim";
}

/** FAST shelf CTA: Claim on demo-* ; Register on issued connected codes. */
export function talisBooksShelfCta(
  fastCode: string | null | undefined,
): TalisBooksSurfaceCta {
  if (isIssuedConnectedFastCode(fastCode)) return "register";
  return "claim";
}

/**
 * Shelves never show a Mapsite back CTA — blue TalisU navbar replaces it.
 * Ebook viewer Back rules stay in talisBooksViewerShowBack.
 */
export function talisBooksShelfShowBack(
  _fastCode: string | null | undefined,
): boolean {
  return false;
}

/** mapsiteId for DemoClaimMarketButton — fall back to platform demo seed. */
export function resolveClaimMapsiteId(
  mapsiteId: string | null | undefined,
): string {
  const id = mapsiteId?.trim() || "";
  return id || DEMO_MAPSITE_ID;
}
