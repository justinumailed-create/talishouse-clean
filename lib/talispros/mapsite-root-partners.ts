/**
 * Root ↔ Derivative Partner Mapsites (Ralf, Oct 17 2026) — pure helpers.
 *
 * A partner link (migration 103) may name its Root side (migration 109). The
 * other side is then that Root's Derivative: its PINs show on the Root's map
 * and it uses the Root's custom PIN categories. A Derivative belongs to at
 * most one Root (unique index on derivative_fast_code). Links without a Root
 * side stay plain partner pairs, so existing links keep working.
 */

export type MapSitePlanRole = "root" | "derivative" | "other";

export type MapSitePartnerLinkRow = {
  id: string;
  fastCodeA: string;
  fastCodeB: string;
  rootFastCode: string | null;
};

export type MapSiteRootPartner = {
  linkId: string;
  fastCode: string;
  title: string | null;
  href: string;
  /** This partner's side of the link, seen from the current Mapsite. */
  relation: "derivative" | "root" | "partner";
};

export type MapSitePartnerPin = {
  id: string;
  fastCode: string;
  latitude: number;
  longitude: number;
  label: string;
  category: string | null;
  href: string;
};

export function otherSideOfLink(link: MapSitePartnerLinkRow, fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return link.fastCodeA === code ? link.fastCodeB : link.fastCodeA;
}

/** How the partner on the other side relates to `fastCode`. */
export function partnerRelation(
  link: MapSitePartnerLinkRow,
  fastCode: string,
): MapSiteRootPartner["relation"] {
  const code = fastCode.trim().toLowerCase();
  if (!link.rootFastCode) return "partner";
  return link.rootFastCode === code ? "derivative" : "root";
}

/** The Root FAST Code this Mapsite belongs to as a Derivative, if any. */
export function rootOfDerivative(
  links: ReadonlyArray<MapSitePartnerLinkRow>,
  fastCode: string,
): string | null {
  const code = fastCode.trim().toLowerCase();
  const link = links.find((l) => l.rootFastCode && l.rootFastCode !== code && (l.fastCodeA === code || l.fastCodeB === code));
  return link?.rootFastCode ?? null;
}

/**
 * Why a Root may not add `candidate` as a Derivative Partner Mapsite, or null
 * when it may. `candidateRole` / `candidateRoot` describe the candidate.
 */
export function rootPartnerAddError(input: {
  rootFastCode: string;
  candidateFastCode: string;
  candidateExists: boolean;
  candidateRole: MapSitePlanRole;
  candidateRoot: string | null;
  alreadyLinked: boolean;
}): string | null {
  const root = input.rootFastCode.trim().toLowerCase();
  const candidate = input.candidateFastCode.trim().toLowerCase();
  if (!candidate) return "Enter a FAST Code.";
  if (candidate === root) return "A Mapsite cannot be its own partner.";
  if (!input.candidateExists) return "No Mapsite was found for that FAST Code.";
  if (input.candidateRole === "root") {
    return "That Mapsite is a Root Account. Root Accounts cannot be added as Derivative partners.";
  }
  if (input.candidateRoot && input.candidateRoot !== root) {
    return "That Mapsite is already a Partner Mapsite of another Root Account.";
  }
  if (input.alreadyLinked) return "That Mapsite is already one of your Partner Mapsites.";
  return null;
}

/** A Derivative Mapsite must be a Root's Partner Mapsite (Ralf, Oct 17). */
export function derivativeNeedsRoot(role: MapSitePlanRole, rootFastCode: string | null): boolean {
  return role === "derivative" && !rootFastCode;
}
