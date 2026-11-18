/**
 * Register checkout codes (Arun). Memorable names, not random contract codes.
 * Add a name here to let that person open /talisu/reg/checkout/*.
 * Matching is case-insensitive and ignores leading and trailing spaces.
 */
/**
 * Public codes the voice agents can say. Spelling is Websterr (capital W,
 * two r's) and Aishaa (capital A, two a's). Matching stays case-insensitive,
 * like the other checkout codes. Follow-up is the person who should hear
 * about that signup. No contract signature is required.
 */
export const PUBLIC_AGENT_CODES = [
  {
    code: "websterr",
    label: "Websterr",
    followUp: "Ralf",
    id: "c0de0000-0000-4000-8000-0000000000b1",
  },
  {
    code: "aishaa",
    label: "Aishaa",
    followUp: "Jonathan",
    id: "c0de0000-0000-4000-8000-0000000000b2",
  },
] as const;

export type PublicAgentCode = (typeof PUBLIC_AGENT_CODES)[number]["code"];

export const CHECKOUT_AGENT_CODES = [
  "aritri",
  "enanko",
  "ralf",
  "arun",
  "demo",
  "websterr",
  "aishaa",
] as const;

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

export function publicAgentFollowUp(raw: unknown): "Ralf" | "Jonathan" | null {
  const code = normalizeCheckoutAgentCode(raw);
  const match = PUBLIC_AGENT_CODES.find((item) => item.code === code);
  return match ? match.followUp : null;
}

export function publicAgentGrantId(raw: unknown): string {
  const code = normalizeCheckoutAgentCode(raw);
  return PUBLIC_AGENT_CODES.find((item) => item.code === code)?.id ?? "";
}
