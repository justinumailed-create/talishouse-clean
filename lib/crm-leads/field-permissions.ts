/**
 * Field-level CRM permissions for Aisha-sourced contacts.
 *
 * Non-global-admin associates (Rishav) cannot overwrite captured identity and
 * source fields, cannot delete, and may only append notes. They may fill
 * previously empty fields and update follow-up status. Global Admin keeps
 * full edit and delete.
 *
 * Pure functions — no database.
 */

import { AISHA_CALL_SOURCE } from "@/lib/aisha-transcript-routing";
import type { CrmActor, LeadField, NormalizedLead } from "@/lib/crm-leads/model";

export const CRM_AISHA_SOURCE = AISHA_CALL_SOURCE;

/** Identity and source fields that lock once a real value has been captured. */
export const CRM_LOCKED_ONCE_CAPTURED_FIELDS = [
  "decision_maker_name",
  "cell_phone",
  "email",
  "brokerage_name",
  "market",
] as const satisfies readonly LeadField[];

export type CrmLockedOnceCapturedField = (typeof CRM_LOCKED_ONCE_CAPTURED_FIELDS)[number];

/** Always view-only for non-global-admin on Aisha-sourced leads (not all are LeadFields). */
export const CRM_ALWAYS_LOCKED_META_FIELDS = [
  "source",
  "source_conversation_id",
  "fast_code",
  "created_at",
  "created_by_agent_id",
  "created_by_name",
] as const;

/** Fields an associate may always change on a lead they can otherwise edit. */
export const CRM_ASSOCIATE_EDITABLE_FIELDS = [
  "status",
  "notes",
  "position",
  "brokerage_website",
  "brokerage_address",
  "office_phone",
  "latitude",
  "longitude",
  "country",
] as const satisfies readonly LeadField[];

const PLACEHOLDER_NAMES = new Set(["unknown caller", "unknown", "n/a", "na"]);
const PLACEHOLDER_BROKERAGES = new Set([
  "unknown brokerage",
  "unknown (aisha call)",
  "aisha call",
  "aisha call prospect",
]);

export type CrmLeadLockSnapshot = Pick<
  NormalizedLead,
  "decisionMakerName" | "cellPhone" | "email" | "brokerageName" | "market" | "notes"
> & {
  source?: string | null;
  sourceConversationId?: string | null;
  fastCode?: string | null;
  createdAt?: string | null;
};

function isBlank(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

export function isAishaSourcedLead(lead: { source?: string | null }): boolean {
  return (lead.source ?? "").trim() === CRM_AISHA_SOURCE;
}

export function isCapturedIdentityValue(field: CrmLockedOnceCapturedField, value: string | null | undefined): boolean {
  if (isBlank(value)) return false;
  const normalized = value!.trim().toLowerCase();
  if (field === "decision_maker_name" && PLACEHOLDER_NAMES.has(normalized)) return false;
  if (field === "brokerage_name" && PLACEHOLDER_BROKERAGES.has(normalized)) return false;
  return true;
}

const FIELD_TO_SNAPSHOT: Record<CrmLockedOnceCapturedField, keyof CrmLeadLockSnapshot> = {
  decision_maker_name: "decisionMakerName",
  cell_phone: "cellPhone",
  email: "email",
  brokerage_name: "brokerageName",
  market: "market",
};

/** Lead form fields the UI must render as read-only for this actor. */
export function lockedLeadFormFields(
  actor: Pick<CrmActor, "role">,
  lead: CrmLeadLockSnapshot,
): LeadField[] {
  if (actor.role === "superadmin") return [];
  if (!isAishaSourcedLead(lead)) return [];
  const locked: LeadField[] = [];
  for (const field of CRM_LOCKED_ONCE_CAPTURED_FIELDS) {
    const current = lead[FIELD_TO_SNAPSHOT[field]];
    if (isCapturedIdentityValue(field, current ?? null)) locked.push(field);
  }
  return locked;
}

export function appendCrmNotes(existing: string | null | undefined, incoming: string | null | undefined): string | null {
  const prev = (existing ?? "").trim();
  const next = (incoming ?? "").trim();
  if (!next) return prev || null;
  if (!prev) return next;
  if (next === prev) return prev;
  if (next.startsWith(prev)) return next;
  if (prev.includes(next) && next.length < prev.length) return prev;
  return `${prev}\n\n${next}`;
}

export type AppliedCrmPermissions = {
  lead: NormalizedLead;
  ignoredFields: string[];
  notesAppended: boolean;
};

/**
 * Enforce locked vs editable fields for a proposed update.
 * Superadmin: proposed lead is returned unchanged.
 * Aisha-sourced + non-global-admin: captured identity/source kept, notes appended.
 * Other leads: unchanged (existing canEditLead rules still apply at the call site).
 */
export function applyCrmFieldPermissions(options: {
  actor: Pick<CrmActor, "role">;
  current: NormalizedLead & CrmLeadLockSnapshot;
  proposed: NormalizedLead;
}): AppliedCrmPermissions {
  const { actor, current, proposed } = options;
  if (actor.role === "superadmin" || !isAishaSourcedLead(current)) {
    return { lead: proposed, ignoredFields: [], notesAppended: false };
  }

  const ignoredFields: string[] = [];
  const next: NormalizedLead = { ...proposed };

  const restore = (field: CrmLockedOnceCapturedField, currentValue: string | null, setter: (value: string | null) => void, proposedValue: string | null) => {
    if (!isCapturedIdentityValue(field, currentValue)) return;
    if ((currentValue ?? "").trim() !== (proposedValue ?? "").trim()) ignoredFields.push(field);
    setter(currentValue);
  };

  restore("decision_maker_name", current.decisionMakerName, (v) => {
    next.decisionMakerName = v || current.decisionMakerName;
  }, proposed.decisionMakerName);
  restore("cell_phone", current.cellPhone, (v) => {
    next.cellPhone = v;
  }, proposed.cellPhone);
  restore("email", current.email, (v) => {
    next.email = v;
  }, proposed.email);
  restore("brokerage_name", current.brokerageName, (v) => {
    next.brokerageName = v || current.brokerageName;
  }, proposed.brokerageName);
  restore("market", current.market, (v) => {
    next.market = v;
  }, proposed.market);

  const appended = appendCrmNotes(current.notes, proposed.notes);
  const notesAppended = (appended ?? "") !== (proposed.notes ?? "").trim() && (appended ?? "") !== (current.notes ?? "").trim();
  if ((current.notes ?? "").trim() && (proposed.notes ?? "").trim() && !(proposed.notes ?? "").trim().startsWith((current.notes ?? "").trim()) && (proposed.notes ?? "").trim() !== (current.notes ?? "").trim()) {
    ignoredFields.push("notes_overwrite");
  }
  next.notes = appended;

  return { lead: next, ignoredFields, notesAppended };
}

export const CRM_PLACEHOLDER_CALLER_NAME = "Unknown caller";
export const CRM_PLACEHOLDER_BROKERAGE_NAME = "Unknown brokerage";
