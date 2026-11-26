import { LEAD_POSITIONS } from "@/lib/crm-leads/model";
import type { LeadFormState } from "@/lib/talispros/call-flow-server";
import type { FormDraftValue } from "@/lib/talispros/form-drafts";

/** localStorage scope for an associate's unsaved lead form, keyed per FAST Code. */
export const ASSOCIATE_LEAD_DRAFT_SCOPE = "associate-lead";

const COUNTRIES = ["Canada", "USA"] as const;

/** Only the fields the associate changed and has not saved yet. */
export function leadDraftChanges(base: LeadFormState, current: LeadFormState): FormDraftValue {
  const changes: FormDraftValue = {};
  for (const key of Object.keys(base) as Array<keyof LeadFormState>) {
    if (key === "id") continue;
    if (current[key] !== base[key]) changes[key] = current[key] ?? "";
  }
  return changes;
}

/**
 * Applies a saved draft on top of the server lead. Unknown keys, non-string
 * values and invalid position/country values are ignored, so a stale draft
 * can never put the form in a state the server would reject.
 */
export function mergeLeadDraft(
  base: LeadFormState,
  draft: Partial<Record<string, unknown>> | null | undefined,
): LeadFormState {
  if (!draft) return base;
  const next: LeadFormState = { ...base };
  for (const key of Object.keys(base) as Array<keyof LeadFormState>) {
    if (key === "id") continue;
    const value = draft[key];
    if (typeof value !== "string") continue;
    if (key === "position") {
      if ((LEAD_POSITIONS as ReadonlyArray<string>).includes(value)) {
        next.position = value as LeadFormState["position"];
      }
      continue;
    }
    if (key === "country") {
      if ((COUNTRIES as ReadonlyArray<string>).includes(value)) {
        next.country = value as LeadFormState["country"];
      }
      continue;
    }
    (next as Record<string, unknown>)[key] = value;
  }
  return next;
}
