import type { RegistrationMarket } from "@/lib/registration-market";
import { claimedMapSiteSegmentForAccountOrPlan } from "@/lib/talispros/mapsite-state";

/**
 * "Assign to Mapsite" for the Add Pin flow (Arun and Ralf, Nov 26).
 *
 * Every PIN can be tied to a Mapsite by FAST Code:
 * - Broker, FSBO and Ad Pro accounts have their own Mapsite. Assigning is
 *   optional; empty means the PIN stays on their own Mapsite only. FSBO and
 *   Ad Pro can use it as a marketing tool to also show the PIN on a Broker's
 *   Mapsite (e.g. under an advertising agreement).
 * - Agents do not get their own Mapsite. Their PINs must be assigned to a
 *   Broker's FAST Code so they appear on that Broker's Mapsite.
 * - A Broker Mapsite shows every PIN assigned to its FAST Code (Agent, FSBO
 *   and Ad Pro PINs) next to its own.
 */
export type PinAccountLevel = "broker" | "fsbo" | "adpro" | "agent";

export const PIN_ACCOUNT_LEVELS: ReadonlyArray<PinAccountLevel> = ["broker", "fsbo", "adpro", "agent"];

export type PinAssignmentRule = {
  level: PinAccountLevel;
  /** Has a Mapsite of its own. */
  ownMapsite: boolean;
  /** Must name a Broker FAST Code before placing a PIN. */
  required: boolean;
};

export const PIN_ASSIGNMENT_RULES: Record<PinAccountLevel, PinAssignmentRule> = {
  broker: { level: "broker", ownMapsite: true, required: false },
  fsbo: { level: "fsbo", ownMapsite: true, required: false },
  adpro: { level: "adpro", ownMapsite: true, required: false },
  agent: { level: "agent", ownMapsite: false, required: true },
};

/** Claimed-URL audience (brokers, fsbos, adpro, listings, homes) to account level. */
export function pinAccountLevelForAudience(audience: RegistrationMarket | string | null | undefined): PinAccountLevel {
  return pinAccountLevelForAccountType(audience);
}

/** mapsites.account_type or a paid plan type to account level. */
export function pinAccountLevelForAccountType(value: string | null | undefined): PinAccountLevel {
  const normalized = value?.trim().toLowerCase() || "";
  if (normalized === "corporate") return "broker";
  if (normalized === "derivative") return "agent";
  const segment = claimedMapSiteSegmentForAccountOrPlan(value);
  if (segment === "brokers") return "broker";
  if (segment === "fsbos") return "fsbo";
  if (segment === "adpro") return "adpro";
  return "agent";
}

const FAST_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/;

/**
 * Normalises a typed FAST Code ("FAST Code: DC 06", " dc06 ") to "dc06".
 * Returns "" for empty input and null when it cannot be a FAST Code.
 */
export function normalizeAssignedFastCode(value: unknown): string | null {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  const cleaned = value
    .trim()
    .replace(/^fast\s*code(™)?\s*[:#]?\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (!cleaned) return "";
  return FAST_CODE_PATTERN.test(cleaned) ? cleaned : null;
}

export type PinAssignmentError = "required" | "invalid" | "self";

export type PinAssignmentResult =
  | { ok: true; assignedFastCode: string | null }
  | { ok: false; error: PinAssignmentError };

/**
 * Client and server share this check. `assignedFastCode: null` means the PIN
 * shows on its own Mapsite only. The server additionally confirms the target
 * is a Broker Mapsite (see brokerTargetError).
 */
export function validatePinAssignment(input: {
  level: PinAccountLevel;
  ownFastCode: string | null | undefined;
  assignedFastCode: unknown;
}): PinAssignmentResult {
  const rule = PIN_ASSIGNMENT_RULES[input.level];
  const code = normalizeAssignedFastCode(input.assignedFastCode);
  const own = normalizeAssignedFastCode(input.ownFastCode) || "";
  if (code === null) return { ok: false, error: "invalid" };
  if (!code) return rule.required ? { ok: false, error: "required" } : { ok: true, assignedFastCode: null };
  if (own && code === own) {
    // Agents cannot assign to themselves; the others just keep it on their own Mapsite.
    return rule.required ? { ok: false, error: "self" } : { ok: true, assignedFastCode: null };
  }
  return { ok: true, assignedFastCode: code };
}

export const PIN_ASSIGNMENT_ERRORS: Record<PinAssignmentError | "notBroker" | "notFound", string> = {
  required: "Agents must assign each PIN to a Broker's Mapsite. Enter the Broker's FAST Code.",
  invalid: "Enter a valid FAST Code, for example DC06.",
  self: "Assign this PIN to a Broker's Mapsite, not your own FAST Code.",
  notFound: "No Mapsite was found for that FAST Code.",
  notBroker: "PINs can only be assigned to a Broker's Mapsite.",
};

/** Server-side target check: the FAST Code must belong to a Broker Mapsite. */
export function brokerTargetError(target: { exists: boolean; level: PinAccountLevel | null }): string | null {
  if (!target.exists) return PIN_ASSIGNMENT_ERRORS.notFound;
  if (target.level !== "broker") return PIN_ASSIGNMENT_ERRORS.notBroker;
  return null;
}

export type AssignedPinRow = {
  id: string;
  mapsite_id: string;
  latitude: number;
  longitude: number;
  label: string | null;
  category: string | null;
  assigned_fast_code: string | null;
};

export type AssignedPinSource = {
  id: string;
  fastCode: string;
  level: PinAccountLevel;
  href: string;
};

export type AssignedPinForBroker = {
  id: string;
  fastCode: string;
  level: PinAccountLevel;
  latitude: number;
  longitude: number;
  label: string;
  category: string | null;
  href: string;
};

/**
 * PINs to draw on a Broker's Mapsite: every row assigned to its FAST Code from
 * Agent, FSBO, Ad Pro (or other Broker) Mapsites. Rows from the Broker's own
 * Mapsite or from unknown sources are skipped.
 */
export function assignedPinsForBroker(input: {
  brokerFastCode: string;
  brokerMapsiteId: string;
  rows: ReadonlyArray<AssignedPinRow>;
  sources: ReadonlyArray<AssignedPinSource>;
}): AssignedPinForBroker[] {
  const code = normalizeAssignedFastCode(input.brokerFastCode) || "";
  if (!code) return [];
  const byId = new Map(input.sources.map((source) => [source.id, source]));
  const out: AssignedPinForBroker[] = [];
  for (const row of input.rows) {
    if ((normalizeAssignedFastCode(row.assigned_fast_code) || "") !== code) continue;
    if (row.mapsite_id === input.brokerMapsiteId) continue;
    const source = byId.get(row.mapsite_id);
    if (!source) continue;
    const upper = source.fastCode.toUpperCase();
    out.push({
      id: `assigned:${row.id}`,
      fastCode: source.fastCode,
      level: source.level,
      latitude: row.latitude,
      longitude: row.longitude,
      label: `${upper} · ${row.label?.trim() || "PIN"}`,
      category: row.category ?? null,
      href: source.href,
    });
  }
  return out;
}

/** True when a Supabase error means the assigned_fast_code column is not there yet. */
export function isMissingAssignmentColumn(message: string | null | undefined): boolean {
  return /assigned_fast_code/i.test(message || "");
}
