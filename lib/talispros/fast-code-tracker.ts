/** FAST Code conversation stages (Ralf, Nov 5). Shared by agent cards and the admin tracker. */

import {
  extractInitials,
  splitPersonName,
  validateAndNormalizeFastCodeInput,
} from "@/validators/fast-code.validator";


export const FAST_CODE_STAGES = [
  "new",
  "contacted",
  "in_conversation",
  "demo_shown",
  "follow_up",
  "won",
  "not_interested",
] as const;
export type FastCodeStage = (typeof FAST_CODE_STAGES)[number];

export const FAST_CODE_STAGE_LABELS: Record<"en" | "de", Record<FastCodeStage, string>> = {
  en: {
    new: "New",
    contacted: "Contacted",
    in_conversation: "In conversation",
    demo_shown: "Demo shown",
    follow_up: "Follow-up",
    won: "Registered / Won",
    not_interested: "Not interested",
  },
  de: {
    new: "Neu",
    contacted: "Kontaktiert",
    in_conversation: "Im Gespräch",
    demo_shown: "Demo gezeigt",
    follow_up: "Nachfassen",
    won: "Registriert / Gewonnen",
    not_interested: "Kein Interesse",
  },
};

export const FAST_CODE_EVENT_LABELS: Record<"en" | "de", Record<FastCodeEventType, string>> = {
  en: {
    stage: "Stage",
    note: "Note",
    listings: "Listings",
    ebook: "eBook",
    assigned: "Assigned",
    sourced: "Sourced",
    refresh: "Daily check",
    step: "Call step",
    comment: "Checkpoint comment",
    lead: "Lead",
    disqualified: "Disqualified",
    requalified: "Restored",
  },
  de: {
    stage: "Phase",
    note: "Notiz",
    listings: "Inserate",
    ebook: "eBook",
    assigned: "Zugewiesen",
    sourced: "Recherchiert",
    refresh: "Tägliche Prüfung",
    step: "Gesprächsschritt",
    comment: "Prüfpunkt-Kommentar",
    lead: "Lead",
    disqualified: "Disqualifiziert",
    requalified: "Wieder aufgenommen",
  },
};

export type FastCodeEventType =
  | "stage"
  | "note"
  | "listings"
  | "ebook"
  | "assigned"
  | "sourced"
  | "refresh"
  | "step"
  | "comment"
  | "lead"
  | "disqualified"
  | "requalified";

export function isFastCodeStage(value: unknown): value is FastCodeStage {
  return typeof value === "string" && (FAST_CODE_STAGES as readonly string[]).includes(value);
}

export function stageLabel(stage: string | null | undefined, locale: string = "en"): string {
  const table = FAST_CODE_STAGE_LABELS[locale === "de" ? "de" : "en"];
  return isFastCodeStage(stage) ? table[stage] : table.new;
}

export interface FastCodeUpdate {
  id: string;
  fastCode: string;
  agentId: string | null;
  eventType: FastCodeEventType;
  stage: FastCodeStage | null;
  note: string | null;
  details: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

/** IST calendar day (YYYY-MM-DD) of an ISO timestamp. */
export function istDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(d.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

/** End of an IST day as a UTC ISO string (exclusive bound for "as of" queries). */
export function istDayEndUtc(day: string): string {
  const start = Date.parse(`${day}T00:00:00.000Z`) - 330 * 60 * 1000;
  return new Date(start + 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Stage of a code as of a moment: the latest "stage" event at or before it,
 * else "new". `updates` may be in any order.
 */
export function stageAsOf(updates: readonly FastCodeUpdate[], beforeIso: string): FastCodeStage {
  let best: FastCodeUpdate | null = null;
  for (const u of updates) {
    if (u.eventType !== "stage" || !u.stage || u.createdAt >= beforeIso) continue;
    if (!best || u.createdAt > best.createdAt) best = u;
  }
  return best?.stage ?? "new";
}

/**
 * Prospect FAST Codes always come from the decision maker's person name
 * (first + last initials), never from brokerage-name words.
 * Matches Mapsite coding via extractInitials (e.g. Hermance Mercure Laplante → hml01).
 */
export function personNamePartsForFastCode(contactName: string | null | undefined): {
  firstName: string;
  middleName: string | null;
  lastName: string;
} | null {
  const raw = (contactName ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return null;
  if (/[&+]|\band\b/iu.test(raw)) {
    const split = splitPersonName(raw);
    if (!split.firstName.trim() || !split.lastName.trim()) return null;
    return { firstName: split.firstName, middleName: null, lastName: split.lastName };
  }
  const words = raw.split(" ").filter(Boolean);
  if (words.length < 2) return null;
  if (words.length === 2) {
    return { firstName: words[0]!, middleName: null, lastName: words[1]! };
  }
  return {
    firstName: words[0]!,
    middleName: words.slice(1, -1).join(" "),
    lastName: words[words.length - 1]!,
  };
}

/** Build first/middle/last from separate admin/CSV fields. Multi-word last names keep trailing surname. */
export function personNamePartsFromFirstLast(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): { firstName: string; middleName: string | null; lastName: string } | null {
  const first = (firstName ?? "").trim().replace(/\s+/g, " ");
  const last = (lastName ?? "").trim().replace(/\s+/g, " ");
  if (!first || !last) return null;
  const lastWords = last.split(" ").filter(Boolean);
  if (lastWords.length > 1) {
    return {
      firstName: first,
      middleName: lastWords.slice(0, -1).join(" "),
      lastName: lastWords[lastWords.length - 1]!,
    };
  }
  return { firstName: first, middleName: null, lastName: last };
}

export function displayContactName(parts: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}): string {
  return [parts.firstName, parts.middleName, parts.lastName].filter(Boolean).join(" ");
}

/** Initials prefix (2–3 letters) from a decision-maker name, or null when unusable. */
export function personInitialsPrefix(contactName: string | null | undefined): string | null {
  const parts = personNamePartsForFastCode(contactName);
  if (!parts) return null;
  try {
    const normalized = validateAndNormalizeFastCodeInput(parts);
    const prefix = extractInitials(normalized).replace(/[^a-z]/g, "");
    return /^[a-z]{2,3}$/.test(prefix) ? prefix : null;
  } catch {
    return null;
  }
}

/**
 * Person-initials FAST Code: "Ralf Meyer" → "rm01", "Hermance Mercure Laplante" → "hml01".
 * Returns null when there is no usable decision-maker name (never falls back to brokerage words).
 */
export function proposeFastCode(contactName: string | null | undefined, taken: ReadonlySet<string>): string | null {
  const prefix = personInitialsPrefix(contactName);
  if (!prefix) return null;
  for (let n = 1; n < 100; n++) {
    const code = `${prefix}${String(n).padStart(2, "0")}`;
    if (!taken.has(code) && !(RESERVED_FAST_CODES as readonly string[]).includes(code)) return code;
  }
  return null;
}

export function proposeFastCodeFromParts(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  taken: ReadonlySet<string>,
): string | null {
  const parts = personNamePartsFromFirstLast(firstName, lastName);
  if (!parts) return null;
  return proposeFastCode(displayContactName(parts), taken);
}

/** Reserved codes that must never be generated. */
export const RESERVED_FAST_CODES = ["pp01", "pp02", "demo", "allpins", "arun"] as const;

/** Pick the associate with the fewest codes (ties → first in list). */
export function pickLeastLoaded<T extends { id: string; count: number }>(agents: readonly T[]): T | null {
  let best: T | null = null;
  for (const a of agents) if (!best || a.count < best.count) best = a;
  return best;
}
