/** Client-safe ALLPINS URL helpers (no server / Supabase imports). */

import { ALLPINS_FAST_CODE } from "@/lib/talispros/allpins-mapsite-constants";
import { ISOLATED_BOOKSHELF_PATH } from "@/lib/talisbooks/isolated-bookshelf";
import { publishedMapSitePath } from "@/lib/talispros/mapsite-state";
import { ROUTES } from "@/lib/routes";

export { ISOLATED_BOOKSHELF_PATH, ALLPINS_FAST_CODE };

/**
 * ALLPINS Mapsite map view — the live /talisu/mkts Markets map.
 * Kept as a named helper so Back / shelf links share one destination.
 */
export function allPinsClaimedHref(): string {
  return ROUTES.TALISU_MARKETS;
}

export function allPinsPublishedHref(): string {
  return publishedMapSitePath(ALLPINS_FAST_CODE);
}
