/**
 * Transaction structure chosen on Webster's page (/talisu/engage). It rides
 * along as ?structure= to the down-payment checkout and into the SamCart URL,
 * where SamCart stores it with the order (custom parameter + utm_term).
 */
/** Anchor of the structure tabs on Webster's page (/talisu/engage#structures). */
export const ENGAGE_STRUCTURES_ANCHOR = "structures";

export const ENGAGE_STRUCTURE_PARAM = "structure";

export const ENGAGE_STRUCTURE_IDS = [
  "conventional",
  "splits",
  "fractionalization",
  "tokenization",
] as const;

export type EngageStructureId = (typeof ENGAGE_STRUCTURE_IDS)[number];

/** One of the four structure ids, or null for anything else. */
export function normalizeEngageStructure(
  value: string | string[] | null | undefined,
): EngageStructureId | null {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase() || "";
  return (ENGAGE_STRUCTURE_IDS as readonly string[]).includes(raw)
    ? (raw as EngageStructureId)
    : null;
}

/** SamCart checkout URL with the chosen structure recorded on the order. */
export function engageStructureCheckoutUrl(
  checkoutUrl: string,
  structure: string | null | undefined,
): string {
  const id = normalizeEngageStructure(structure);
  if (!id) return checkoutUrl;
  const url = new URL(checkoutUrl);
  url.searchParams.set(ENGAGE_STRUCTURE_PARAM, id);
  url.searchParams.set("utm_term", id);
  return url.toString();
}
