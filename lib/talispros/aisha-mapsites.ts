import { personalHomePath } from "@/lib/talispros/personal-home";

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
 * Every claimed Mapsite uses DC06's project line. The homepage keeps its
 * own greeting.
 */
export function mapsiteAishaInvitation(): "callback" {
  return "callback";
}

/**
 * Homepage FAST Code Open. Every code opens that owner's personal homepage
 * first. The Mapsite stays one click away from that page.
 */
export function fastCodeEntryHref(options: {
  fastCode: string;
  accountType?: string | null;
  claimed?: boolean;
}): string {
  return personalHomePath(options.fastCode);
}
