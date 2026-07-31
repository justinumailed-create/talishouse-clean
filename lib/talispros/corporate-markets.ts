export type CorporateMarketAccountRole =
  | "root"
  | "derivative"
  | "fsbo"
  | "adpro";

export const CORPORATE_MARKET_ACCOUNT_ROLES: readonly CorporateMarketAccountRole[] = [
  "root",
  "derivative",
  "fsbo",
  "adpro",
] as const;

const ROLE_SET = new Set<CorporateMarketAccountRole>(
  CORPORATE_MARKET_ACCOUNT_ROLES
);

export function normalizeCorporateMarketAccountRole(
  value: string | null | undefined
): CorporateMarketAccountRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as CorporateMarketAccountRole;
  return ROLE_SET.has(normalized) ? normalized : null;
}
