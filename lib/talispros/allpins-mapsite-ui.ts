/** Client-safe ALLPINS URL helpers (no server / Supabase imports). */

import { ALLPINS_FAST_CODE } from "@/lib/talispros/allpins-mapsite-constants";
import { ISOLATED_BOOKSHELF_PATH } from "@/lib/talisbooks/isolated-bookshelf";
import {
  buildClaimedMapSitePath,
  publishedMapSitePath,
} from "@/lib/talispros/mapsite-state";

export { ISOLATED_BOOKSHELF_PATH, ALLPINS_FAST_CODE };

export function allPinsClaimedHref(): string {
  return buildClaimedMapSitePath({
    fastCode: ALLPINS_FAST_CODE,
    accountType: "brokers",
  });
}

export function allPinsPublishedHref(): string {
  return publishedMapSitePath(ALLPINS_FAST_CODE);
}
