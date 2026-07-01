export type RegistrationMarket = "listings" | "homes" | "fsbos";

export type RegistrationAccountCategory = "root" | "derivative" | "adpro";

export interface RegistrationMarketCopy {
  label: string;
  subtitle: string;
}

export const REGISTRATION_MARKET_COPY: Record<
  RegistrationMarket,
  RegistrationMarketCopy
> = {
  listings: {
    label: "Licensed Real Estate Professional",
    subtitle:
      "Register your Talispros™ account to establish service floors and promote your listings globally.",
  },
  homes: {
    label: "Homes & Cottages Representative",
    subtitle:
      "Register your Talispros™ account to identify new projects and promote fractional ownership opportunities.",
  },
  fsbos: {
    label: "For-Sale-By-Owner",
    subtitle:
      "Register your Talispros™ account to extend your FSBO reach and avoid expensive listing commitments.",
  },
};

const MARKET_ALIASES: Record<string, RegistrationMarket> = {
  listings: "listings",
  listing: "listings",
  homes: "homes",
  home: "homes",
  cottages: "homes",
  fsbos: "fsbos",
  fsbo: "fsbos",
};

export function parseRegistrationMarket(
  value: string | null | undefined
): RegistrationMarket | null {
  if (!value) return null;
  return MARKET_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function parseRegistrationAccountCategory(
  value: string | null | undefined
): RegistrationAccountCategory | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "root") return "root";
  if (normalized === "derivative") return "derivative";
  if (normalized === "adpro") return "adpro";
  return null;
}

/** Legacy `?plan=` URLs map to an initial account category on the unified register page. */
export function accountCategoryFromLegacyPlan(
  plan: string | null | undefined
): RegistrationAccountCategory | null {
  return parseRegistrationAccountCategory(plan);
}

export const ROOT_ACCOUNT_DISPLAY_BULLETS = [
  "Up to 100 Derivative Accounts",
  "SPLITS enabled",
  "Claim A Market™ eligible",
] as const;
