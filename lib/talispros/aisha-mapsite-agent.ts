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

/**
 * First name from the Mapsite row when it is stored.
 * Otherwise the display name already on the record. Never a guessed split.
 */
export function aishaOwnerName(input: AishaMapsiteDynamicInput): string | null {
  const first = input.ownerFirstName?.trim() || "";
  if (first) return first;
  const display = input.agentName?.trim() || "";
  return display || null;
}

/**
 * JSON for the widget `dynamic-variables` attribute.
 * Blank values are left out. `<` is escaped so the attribute cannot break HTML.
 * Returns undefined when nothing is known, so the attribute is omitted.
 */
export function aishaMapsiteDynamicVariables(
  input: AishaMapsiteDynamicInput,
): string | undefined {
  const vars: Record<string, string> = {};
  const owner = aishaOwnerName(input);
  const code = input.fastCode?.trim() || "";
  const title = input.mapsiteTitle?.trim() || "";
  if (owner) vars.owner_name = owner;
  if (code) vars.fast_code = code;
  if (title) vars.mapsite_title = title;
  if (Object.keys(vars).length === 0) return undefined;
  return JSON.stringify(vars).replace(/</g, "\\u003c");
}
