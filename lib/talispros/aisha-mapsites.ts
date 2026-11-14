import { personalHomePath } from "@/lib/talispros/personal-home";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

/** A stored status that is no longer an open, unclaimed slot. */
export function isClaimedMapSiteStatus(status: string | null | undefined): boolean {
  const value = status?.trim().toLowerCase() || "";
  return value !== "" && value !== "unclaimed";
}

/** Aisha's Mapsite agent is on every claimed Mapsite. */
export function mapsiteShowsAisha(status: string | null | undefined): boolean {
  return isClaimedMapSiteStatus(status);
}

/**
 * DC06 keeps its project invitation. Every other claimed Mapsite uses the
 * short default line.
 */
export function mapsiteAishaInvitation(
  fastCode: string | null | undefined,
): "callback" | "mapsite" {
  return fastCode?.trim().toLowerCase() === "dc06" ? "callback" : "mapsite";
}

/**
 * Homepage FAST Code Open. A claimed code goes to that Mapsite's map.
 * The account-type segment comes from the Mapsite's own plan, not a
 * hardcoded code list. Unclaimed codes still open the personal home page.
 */
export function fastCodeEntryHref(options: {
  fastCode: string;
  accountType?: string | null;
  claimed?: boolean;
}): string {
  const code = options.fastCode.trim().toLowerCase();
  if (options.claimed) {
    return buildClaimedMapSitePath({
      fastCode: code,
      accountType: options.accountType,
    });
  }
  return personalHomePath(code);
}
