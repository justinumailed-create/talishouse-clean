/**
 * Register checkout codes (Arun). Memorable names, not random contract codes.
 * Add a name here to let that person open /talisu/reg/checkout/*.
 * Matching is case-insensitive and ignores leading and trailing spaces.
 */
export const CHECKOUT_AGENT_CODES = ["aritri", "enanko", "ralf", "arun", "demo"] as const;

export type CheckoutAgentCode = (typeof CHECKOUT_AGENT_CODES)[number];

const CHECKOUT_AGENT_CODE_SET = new Set<string>(CHECKOUT_AGENT_CODES);

export function normalizeCheckoutAgentCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toLowerCase();
}

export function isCheckoutAgentCode(raw: unknown): boolean {
  const code = normalizeCheckoutAgentCode(raw);
  return code.length > 0 && CHECKOUT_AGENT_CODE_SET.has(code);
}
