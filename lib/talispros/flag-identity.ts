export const MAPSITE_FLAG_IDENTITY_VALUES = ["address", "name"] as const;

export type MapsiteFlagIdentity = (typeof MAPSITE_FLAG_IDENTITY_VALUES)[number];

export const MAPSITE_FLAG_IDENTITY_DEFAULT: MapsiteFlagIdentity = "address";

export function parseMapsiteFlagIdentity(
  value: string | null | undefined,
): MapsiteFlagIdentity {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "name" ? "name" : MAPSITE_FLAG_IDENTITY_DEFAULT;
}

/** FSBO flags always use Address. Other accounts honor the saved preference. */
export function resolveMapsiteFlagIdentity(input: {
  preference?: string | null;
  accountType?: string | null;
}): MapsiteFlagIdentity {
  const accountType = (input.accountType || "").trim().toLowerCase();
  if (accountType === "fsbo") return "address";
  return parseMapsiteFlagIdentity(input.preference);
}
