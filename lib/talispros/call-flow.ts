/**
 * Guided call flow for prospect FAST Codes.
 *
 * Derived from the Tsplits™ sales playbook
 * (private/tsplits/tsplits-sales-playbook.html, section 5 "Call flow"
 * and section 6 "Objection handling") and the existing Registration
 * entry-code gate (/talisu/reg, lib/talisu/register-entry.ts).
 *
 * Playbook stage → saved step → fast_code_status.stage
 *   Stage 1 Opener            opener        contacted          checkpoint after_first_contact
 *   Stage 2 hook (line 1)     hook          in_conversation
 *   Stage 2 how (line 2)      how           in_conversation
 *   Stage 3 Walk-through      walkthrough   demo_shown         checkpoint after_demo
 *   Stage 4 Value points      value         demo_shown         (same stage: the conversation during the walk-through)
 *   Stage 5 More time         time          follow_up          checkpoint before_registration
 *   Registration entry code   register      won
 *   Any step, prospect stops  outcome not_interested → stage not_interested, later steps stay locked
 *
 * The seven fast_code_status stages are unchanged. Steps are the finer
 * order agents must follow. A step stays locked until the previous step
 * has a saved "continue" response.
 */

import type { AdminAccount } from "@/lib/admin-constants";
import { accountHasAdminScope, isGlobalAdmin } from "@/lib/admin-constants";
import type { LeadStatus } from "@/lib/crm-leads/model";
import type { FastCodeStage } from "@/lib/talispros/fast-code-tracker";
import { istDay } from "@/lib/talispros/fast-code-tracker";
import { SALES_ASSOCIATE_LOGINS } from "@/lib/talispros/fast-code-slots";

/** Reviewer beats a plain agent. Ralf's admin grant (agents or FAST Codes) counts as admin. */
export function flowAccess(account: AdminAccount | null | undefined): "agent" | "reviewer" | "admin" | null {
  if (!account) return null;
  if (account.access === "agent" && account.reviewer) return "reviewer";
  if (account.access === "agent" && account.agentId) return "agent";
  if (isGlobalAdmin(account)) return "admin";
  if (accountHasAdminScope(account, "agents") || accountHasAdminScope(account, "fast-codes")) return "admin";
  return null;
}

export function canEditFlowLead(access: ReturnType<typeof flowAccess>, actorId: string | null, ownerId: string | null): boolean {
  if (access === "admin") return true;
  return access === "agent" && Boolean(actorId) && actorId === ownerId;
}

export function canCommentOnFlow(access: ReturnType<typeof flowAccess>): boolean {
  return access === "admin" || access === "reviewer";
}

export const CALL_STEP_KEYS = ["opener", "hook", "how", "walkthrough", "value", "time", "register"] as const;
export type CallStepKey = (typeof CALL_STEP_KEYS)[number];

export const CHECKPOINT_KEYS = ["after_first_contact", "after_demo", "before_registration"] as const;
export type CheckpointKey = (typeof CHECKPOINT_KEYS)[number];

export type StepOutcome = "continue" | "not_interested";

export const STEP_POINTS = 10;
export const REGISTER_BONUS = 15;

export const STEP_STAGE: Record<CallStepKey, FastCodeStage> = {
  opener: "contacted",
  hook: "in_conversation",
  how: "in_conversation",
  walkthrough: "demo_shown",
  value: "demo_shown",
  time: "follow_up",
  register: "won",
};

export type SavedStep = {
  step: CallStepKey;
  outcome: StepOutcome;
  response: string;
  at: string;
};

export type BadgeKey = "first_call" | "first_demo" | "first_registration";

export function isCallStepKey(value: unknown): value is CallStepKey {
  return typeof value === "string" && (CALL_STEP_KEYS as readonly string[]).includes(value);
}

export function isCheckpointKey(value: unknown): value is CheckpointKey {
  return typeof value === "string" && (CHECKPOINT_KEYS as readonly string[]).includes(value);
}

export function isStepOutcome(value: unknown): value is StepOutcome {
  return value === "continue" || value === "not_interested";
}

export function stepIndex(key: CallStepKey): number {
  return CALL_STEP_KEYS.indexOf(key);
}

export function savedStep(saved: readonly SavedStep[], key: CallStepKey): SavedStep | null {
  return saved.find((row) => row.step === key) ?? null;
}

/** True when every earlier step was saved with outcome "continue". */
export function isStepUnlocked(key: CallStepKey, saved: readonly SavedStep[]): boolean {
  const index = stepIndex(key);
  for (let i = 0; i < index; i += 1) {
    const row = savedStep(saved, CALL_STEP_KEYS[i]!);
    if (!row || row.outcome !== "continue") return false;
  }
  return true;
}

export function nextStepKey(saved: readonly SavedStep[]): CallStepKey | "done" | "stopped" {
  for (const key of CALL_STEP_KEYS) {
    const row = savedStep(saved, key);
    if (!row) return key;
    if (row.outcome !== "continue") return "stopped";
  }
  return "done";
}

export function progressPercent(saved: readonly SavedStep[]): number {
  const done = CALL_STEP_KEYS.filter((key) => savedStep(saved, key)).length;
  return Math.round((done / CALL_STEP_KEYS.length) * 100);
}

export function pointsForSteps(saved: readonly SavedStep[]): number {
  let points = saved.length * STEP_POINTS;
  if (saved.some((row) => row.step === "register" && row.outcome === "continue")) points += REGISTER_BONUS;
  return points;
}

/** Checkpoint a saved step opens. First contact opens even if the prospect stops. */
export function checkpointOpenedBy(step: CallStepKey, outcome: StepOutcome): CheckpointKey | null {
  if (step === "opener") return "after_first_contact";
  if (outcome !== "continue") return null;
  if (step === "walkthrough") return "after_demo";
  if (step === "time") return "before_registration";
  return null;
}

export function stageForOutcome(step: CallStepKey, outcome: StepOutcome): FastCodeStage {
  if (outcome === "not_interested") return "not_interested";
  return STEP_STAGE[step];
}

export function leadStatusForStage(stage: FastCodeStage): LeadStatus {
  if (stage === "new") return "new";
  if (stage === "contacted" || stage === "in_conversation") return "contacted";
  if (stage === "demo_shown" || stage === "follow_up") return "replied";
  if (stage === "won") return "registered";
  return "not_interested";
}

export type NextAction = { band: number; touched: string };

/** Lower band is the earlier unfinished step. Done, then stopped, sink to the bottom. */
export function nextActionOf(saved: readonly SavedStep[], touchedAt: string): NextAction {
  const next = nextStepKey(saved);
  if (next === "stopped") return { band: 90, touched: touchedAt };
  if (next === "done") return { band: 50, touched: touchedAt };
  return { band: stepIndex(next), touched: touchedAt };
}

export function compareNextAction(a: NextAction, b: NextAction): number {
  if (a.band !== b.band) return a.band - b.band;
  if (a.touched === b.touched) return 0;
  return a.touched < b.touched ? -1 : 1;
}

function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const value = new Date(Date.UTC(year || 1970, (month || 1) - 1, date || 1));
  value.setUTCDate(value.getUTCDate() + delta);
  return value.toISOString().slice(0, 10);
}

/** Consecutive IST days with a saved step, ending today or yesterday. */
export function activityStreak(isoTimes: readonly string[], now: Date = new Date()): number {
  const days = new Set(isoTimes.map((iso) => istDay(iso)));
  let cursor = istDay(now);
  if (!days.has(cursor)) {
    cursor = shiftDay(cursor, -1);
    if (!days.has(cursor)) return 0;
  }
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function earnedBadges(saved: readonly SavedStep[]): BadgeKey[] {
  const badges: BadgeKey[] = [];
  if (saved.some((row) => row.step === "opener")) badges.push("first_call");
  if (saved.some((row) => row.step === "walkthrough" && row.outcome === "continue")) badges.push("first_demo");
  if (saved.some((row) => row.step === "register" && row.outcome === "continue")) badges.push("first_registration");
  return badges;
}

export function isLeaderboardLogin(loginId: string): boolean {
  return (SALES_ASSOCIATE_LOGINS as readonly string[]).includes(loginId);
}

export function rankLeaderboard<T extends { points: number; loginId: string }>(rows: readonly T[]): T[] {
  const order = new Map<string, number>(SALES_ASSOCIATE_LOGINS.map((login, index) => [login, index]));
  return [...rows].sort((a, b) => b.points - a.points || (order.get(a.loginId) ?? 9) - (order.get(b.loginId) ?? 9));
}

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);
const CA_PROVINCES = new Set(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]);

/** Prospect province code → country. Unknown codes stay in Canada (CAD, kilometres). */
export function countryFromProvince(province: string | null | undefined): "Canada" | "USA" {
  const code = (province || "").trim().toUpperCase();
  if (US_STATES.has(code)) return "USA";
  if (CA_PROVINCES.has(code)) return "Canada";
  return "Canada";
}

export function firstNameOf(name: string | null | undefined): string {
  const token = (name || "").trim().split(/\s+/)[0] || "";
  if (!token || token.length < 2) return "";
  return token;
}

export type CallScriptVars = {
  firstName: string;
  agentName: string;
  brokerage: string;
  town: string;
  position: string;
  fastCode: string;
  mapsiteUrl: string;
  tebUrl: string;
  registerUrl: string;
  agentCount: number | null;
};
