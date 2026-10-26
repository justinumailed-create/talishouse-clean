/**
 * Aisha's registration page (/talisu/reg): the four transaction structures a
 * Mapsite can be registered for. The selected tabs (one or more) travel as
 * ?structure=<id>[,<id>…]
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

/**
 * The selection after clicking one of the four toggles: adds it (at the end)
 * when it was not selected, removes it when it was. Order stays as clicked.
 */
export function toggleRegisterStructure(
  selected: readonly RegisterStructureId[],
  id: RegisterStructureId,
): RegisterStructureId[] {
  return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
}

/**
 * Every valid structure in a ?structure= value (comma-separated and/or
 * repeated, like ?product=P03,P07), de-duplicated in the order given.
 * Unknown values are dropped. Cookie values may arrive URL-encoded (%2C).
 */
export function parseRegisterStructures(value: unknown): RegisterStructureId[] {
  const raw = (Array.isArray(value) ? value : [value]).flatMap((v) =>
    typeof v === "string" ? v.split(/,|%2c/i) : [],
  );
  const out: RegisterStructureId[] = [];
  for (const part of raw) {
    const id = normalizeRegisterStructure(part);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** "lease-to-own,tokenization" (readable commas) for URLs and SamCart. */
export function registerStructuresParam(structures: unknown): string {
  return parseRegisterStructures(structures).join(",");
}

/** Aisha's landing with the given tabs selected: /talisu/reg?structure=a,b. */
export function talisURegisterStructureHref(structure: unknown): string {
  const ids = registerStructuresParam(structure);
  return ids ? `/talisu/reg?${REGISTER_STRUCTURE_PARAM}=${ids}` : "/talisu/reg";
}

/**
 * Register lock (Arun, Oct 26): "Register now" and the checkout step need at
 * least one structure. A checkout URL without one is sent back to the landing
 * with ?locked=structure.
 */
export const REGISTER_LOCK_PARAM = "locked";
export type RegisterLockReason = "structure";

export function normalizeRegisterLockReason(value: unknown): RegisterLockReason | null {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.trim().toLowerCase() === "structure"
    ? "structure"
    : null;
}

/** Where a checkout URL without a structure goes back to. */
export function registerLockedHref(fastCode?: string | null): string {
  const params = new URLSearchParams({ [REGISTER_LOCK_PARAM]: "structure" });
  const code = fastCode?.trim();
  if (code) params.set("fastCode", code);
  return `/talisu/reg?${params.toString()}`;
}

/**
 * Adds structure + utm_term to the SamCart register checkout URL; several
 * structures ride comma-separated in those same two keys.
 */
export function registerStructureCheckoutUrl(base: string, structure: unknown): string {
  const ids = registerStructuresParam(structure);
  if (!ids) return base;
  const url = new URL(base);
  url.searchParams.set(REGISTER_STRUCTURE_PARAM, ids);
  url.searchParams.set("utm_term", ids);
  return url.toString();
}

/** Client-side cookie string for the chosen structure(s). */
export function registerStructureCookie(structure: unknown): string {
  const value = encodeURIComponent(registerStructuresParam(structure));
  return `${REGISTER_STRUCTURE_COOKIE}=${value}; path=/; max-age=${REGISTER_STRUCTURE_COOKIE_MAX_AGE}; samesite=lax`;
}

/** Client-side cookie string that forgets the chosen structure. */
export function clearRegisterStructureCookie(): string {
  return `${REGISTER_STRUCTURE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * Browser only: remember (or forget) the chosen structure(s) so they survive
 * the PMC registration sequence, and keep the address bar on the shareable
 * /talisu/reg?structure=a,b link.
 */
export function rememberRegisterStructure(structures: readonly RegisterStructureId[]): void {
  if (typeof window === "undefined") return;
  document.cookie = structures.length
    ? registerStructureCookie(structures)
    : clearRegisterStructureCookie();
  const url = new URL(window.location.href);
  const ids = registerStructuresParam(structures);
  if (ids) url.searchParams.set(REGISTER_STRUCTURE_PARAM, ids);
  else url.searchParams.delete(REGISTER_STRUCTURE_PARAM);
  url.searchParams.delete(REGISTER_LOCK_PARAM);
  const query = url.searchParams.toString().replace(/%2C/gi, ",");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${query ? `?${query}` : ""}`,
  );
}
