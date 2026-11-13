/** Client-safe Register checkout routes. SamCart URLs stay server-only. */

export const REGISTER_CHECKOUT_IDS = ["broker", "agent", "fsbo", "adpro", "pin"] as const;

export type RegisterCheckoutId = (typeof REGISTER_CHECKOUT_IDS)[number];

export function isRegisterCheckoutId(value: string | null | undefined): value is RegisterCheckoutId {
  return REGISTER_CHECKOUT_IDS.includes(value as RegisterCheckoutId);
}

/** First-party page that embeds the product checkout after the agent-code gate. */
export function registerCheckoutPath(id: RegisterCheckoutId): string {
  return `/talisu/reg/checkout/${id}`;
}
