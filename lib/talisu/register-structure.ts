/**
 * Aisha's registration page (/talisu/reg): the four transaction structures a
 * Mapsite can be registered for. The one selected tab travels as
 * ?structure=<id> from the landing to the register checkout and into the SamCart URL
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
 * Exactly one structure from a ?structure= (or cookie) value (Arun, Oct 26:
 * Aisha's tabs are single-select). A comma list, repeated params or an
 * unknown value give null, so a bypassing checkout URL is sent back.
 * Cookie values may arrive URL-encoded.
 */
export function parseSingleRegisterStructure(value: unknown): RegisterStructureId | null {
  if (Array.isArray(value)) {
    return value.length === 1 ? parseSingleRegisterStructure(value[0]) : null;
  }
  if (typeof value !== "string") return null;
  let raw = value;
  try {
    raw = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (raw.includes(",")) return null;
  return normalizeRegisterStructure(raw);
}

/**
 * Single-select (radio) click: the clicked tab replaces the previous one.
 * Clicking the already-selected tab keeps it selected (radios do not clear).
 */
export function selectRegisterStructure(
  current: RegisterStructureId | null,
  clicked: unknown,
): RegisterStructureId | null {
  return normalizeRegisterStructure(clicked) ?? current;
}

/** Aisha's landing with the given tab selected: /talisu/reg?structure=<id>. */
export function talisURegisterStructureHref(structure: unknown): string {
  const id = parseSingleRegisterStructure(structure);
  return id ? `/talisu/reg?${REGISTER_STRUCTURE_PARAM}=${id}` : "/talisu/reg";
}

/**
 * Register lock (Arun, Oct 26): "Register now" and the checkout step need
 * exactly one structure. A checkout URL without one (or with a comma list or
 * an unknown value) is sent back to the landing with ?locked=structure.
 */
export const REGISTER_LOCK_PARAM = "locked";
export type RegisterLockReason = "structure";

export function normalizeRegisterLockReason(value: unknown): RegisterLockReason | null {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.trim().toLowerCase() === "structure"
    ? "structure"
    : null;
}

/** Where a checkout URL without a single valid structure goes back to. */
export function registerLockedHref(fastCode?: string | null): string {
  const params = new URLSearchParams({ [REGISTER_LOCK_PARAM]: "structure" });
  const code = fastCode?.trim();
  if (code) params.set("fastCode", code);
  return `/talisu/reg?${params.toString()}`;
}

/** Adds the one structure as structure + utm_term to the SamCart register URL. */
export function registerStructureCheckoutUrl(base: string, structure: unknown): string {
  const id = parseSingleRegisterStructure(structure);
  if (!id) return base;
  const url = new URL(base);
  url.searchParams.set(REGISTER_STRUCTURE_PARAM, id);
  url.searchParams.set("utm_term", id);
  return url.toString();
}

/** Client-side cookie string for the chosen structure (one value). */
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
  document.cookie = structure ? registerStructureCookie(structure) : clearRegisterStructureCookie();
  const url = new URL(window.location.href);
  if (structure) url.searchParams.set(REGISTER_STRUCTURE_PARAM, structure);
  else url.searchParams.delete(REGISTER_STRUCTURE_PARAM);
  url.searchParams.delete(REGISTER_LOCK_PARAM);
  const query = url.searchParams.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${query ? `?${query}` : ""}`,
  );
}
