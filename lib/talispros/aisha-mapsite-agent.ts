/** Homepage and every page that is not a Mapsite. */
export const AISHA_HOMEPAGE_AGENT_ID = "agent_0401m7cxgba1fhwb35aqr43acnv1";

/** Claimed Mapsite pages. Greets the client with the Mapsite's own variables. */
export const AISHA_MAPSITE_AGENT_ID = "agent_0201m7dr7y7bfy99sz2ywxcbshm4";

export type AishaMapsiteDynamicInput = {
  ownerFirstName?: string | null;
  agentName?: string | null;
  fastCode?: string | null;
  mapsiteTitle?: string | null;
};

/** Spoken when the Mapsite has no stored owner name. */
export const AISHA_OWNER_NAME_FALLBACK = "there";

/**
 * First name from the Mapsite row when it is stored.
 * Otherwise the display name already on the record. Never a guessed split.
 * Always a name the agent can say, so {{owner_name}} is never left literal.
 */
export function aishaOwnerName(input: AishaMapsiteDynamicInput): string {
  const first = input.ownerFirstName?.trim() || "";
  if (first) return first;
  const display = input.agentName?.trim() || "";
  return display || AISHA_OWNER_NAME_FALLBACK;
}

/**
 * JSON for the widget `dynamic-variables` attribute.
 * owner_name, fast_code, and mapsite_title are always present.
 * `<` is escaped so the attribute cannot break HTML.
 */
export function aishaMapsiteDynamicVariables(input: AishaMapsiteDynamicInput): string {
  const vars = {
    owner_name: aishaOwnerName(input),
    fast_code: input.fastCode?.trim() || "",
    mapsite_title: input.mapsiteTitle?.trim() || "",
  };
  return JSON.stringify(vars).replace(/</g, "\\u003c");
}
