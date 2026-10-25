/**
 * Aisha's registration page (/talisu/reg): the four transaction structures a
 * Mapsite can be registered for. The selected tab travels as ?structure=<id>
 * from the landing to the register checkout and into the SamCart URL
 * (structure + utm_term), so every registration is tagged with it.
 *
 * Kept separate from lib/talisu/engage-structure.ts so Aisha's ids
 * (with Lease-to-Own) do not depend on the engage page's picker.
 */
export const REGISTER_STRUCTURE_PARAM = "structure";

/**
 * Remembers the chosen structure for 30 days, so a visitor who is sent
 * through the PMC registration sequence first still checks out with it.
 */
export const REGISTER_STRUCTURE_COOKIE = "talisu_reg_structure";
export const REGISTER_STRUCTURE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const REGISTER_STRUCTURE_IDS = [
  "conventional",
  "lease-to-own",
  "fractionalization",
  "tokenization",
] as const;

export type RegisterStructureId = (typeof REGISTER_STRUCTURE_IDS)[number];

/** Older links used SPLITS for what is now Lease-to-Own. */
const REGISTER_STRUCTURE_ALIASES: Record<string, RegisterStructureId> = {
  splits: "lease-to-own",
};

/** Returns one of the four ids, or null for anything else. */
export function normalizeRegisterStructure(value: unknown): RegisterStructureId | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return null;
  const key = first.trim().toLowerCase();
  if ((REGISTER_STRUCTURE_IDS as readonly string[]).includes(key)) {
    return key as RegisterStructureId;
  }
  return REGISTER_STRUCTURE_ALIASES[key] ?? null;
}

/** Aisha's landing with a structure tab open: /talisu/reg?structure=<id>. */
export function talisURegisterStructureHref(structure: unknown): string {
  const id = normalizeRegisterStructure(structure);
  return id ? `/talisu/reg?${REGISTER_STRUCTURE_PARAM}=${id}` : "/talisu/reg";
}

/** Adds structure + utm_term to the SamCart register checkout URL. */
export function registerStructureCheckoutUrl(base: string, structure: unknown): string {
  const id = normalizeRegisterStructure(structure);
  if (!id) return base;
  const url = new URL(base);
  url.searchParams.set(REGISTER_STRUCTURE_PARAM, id);
  url.searchParams.set("utm_term", id);
  return url.toString();
}

/** Client-side cookie string for the chosen structure. */
export function registerStructureCookie(structure: RegisterStructureId): string {
  return `${REGISTER_STRUCTURE_COOKIE}=${structure}; path=/; max-age=${REGISTER_STRUCTURE_COOKIE_MAX_AGE}; samesite=lax`;
}

/** Client-side cookie string that forgets the chosen structure. */
export function clearRegisterStructureCookie(): string {
  return `${REGISTER_STRUCTURE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * Browser only: remember (or forget) the chosen structure so it survives the
 * PMC registration sequence, and keep the address bar on the shareable
 * /talisu/reg?structure=<id> link.
 */
export function rememberRegisterStructure(structure: RegisterStructureId | null): void {
  if (typeof window === "undefined") return;
  document.cookie = structure
    ? registerStructureCookie(structure)
    : clearRegisterStructureCookie();
  window.history.replaceState(
    window.history.state,
    "",
    talisURegisterStructureHref(structure),
  );
}
