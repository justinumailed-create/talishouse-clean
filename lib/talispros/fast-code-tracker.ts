/** FAST Code conversation stages (Ralf, Nov 5). Shared by agent cards and the admin tracker. */

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
  | "lead";

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

/** Initials-based FAST Code: "Jane Doe Realty" → "jdr01", skipping taken codes. */
export function proposeFastCode(name: string, taken: ReadonlySet<string>): string {
  const words = name
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(inc|ltd|llc|the|and|of)$/i.test(w));
  let base = words.map((w) => w[0]!.toLowerCase()).join("").replace(/[^a-z]/g, "").slice(0, 4);
  if (base.length < 2) base = (words.join("").toLowerCase().replace(/[^a-z]/g, "") + "xx").slice(0, 2);
  for (let n = 1; n < 100; n++) {
    const code = `${base}${String(n).padStart(2, "0")}`;
    if (!taken.has(code) && !(RESERVED_FAST_CODES as readonly string[]).includes(code)) return code;
  }
  return `${base}${Date.now() % 10000}`;
}

/** Reserved codes that must never be generated. */
export const RESERVED_FAST_CODES = ["pp01", "pp02", "demo", "allpins", "arun"] as const;

/** Pick the associate with the fewest codes (ties → first in list). */
export function pickLeastLoaded<T extends { id: string; count: number }>(agents: readonly T[]): T | null {
  let best: T | null = null;
  for (const a of agents) if (!best || a.count < best.count) best = a;
  return best;
}
