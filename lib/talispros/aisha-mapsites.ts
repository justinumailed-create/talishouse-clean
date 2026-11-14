import { personalHomePath } from "@/lib/talispros/personal-home";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

/**
 * FAST Codes that show Aisha and open straight onto the claimed Mapsite.
 * The value is the Mapsite path segment. DC06 has a completed Root Account
 * plan, which opens under brokers. Add a code here to turn the widget on
 * for another Mapsite.
 */
export const AISHA_MAPSITE_FAST_CODES: Record<string, string> = {
  dc06: "brokers",
};

export function mapsiteShowsAisha(fastCode: string | null | undefined): boolean {
  const code = fastCode?.trim().toLowerCase() || "";
  return Object.prototype.hasOwnProperty.call(AISHA_MAPSITE_FAST_CODES, code);
}

/**
 * Where the existing FAST Code gate goes. Allowlisted codes land on the
 * claimed Mapsite. Every other code still opens the personal home page.
 */
export function fastCodeEntryHref(options: {
  fastCode: string;
  accountType?: string | null;
}): string {
  const code = options.fastCode.trim().toLowerCase();
  if (mapsiteShowsAisha(code)) {
    return buildClaimedMapSitePath({
      fastCode: code,
      accountType: AISHA_MAPSITE_FAST_CODES[code] || options.accountType,
    });
  }
  return personalHomePath(code);
}
