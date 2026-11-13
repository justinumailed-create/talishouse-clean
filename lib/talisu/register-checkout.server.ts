import "server-only";
import {
  isRegisterCheckoutId,
  type RegisterCheckoutId,
} from "@/lib/talisu/register-checkout";

/** SamCart marketplace subdomain for the official sc-checkout embed. */
export const SAMCART_CHECKOUT_SUBDOMAIN = "talispros";

/**
 * SamCart product slugs. The PIN page is our route `/pin`; SamCart's product
 * id is `listpin`. Resolved only after the agent-code gate, so the embed is
 * not in the HTML before verification. A raw checkout link on SamCart stays
 * public for anyone who already has it.
 */
const REGISTER_CHECKOUT_PRODUCTS: Record<RegisterCheckoutId, string> = {
  broker: "broker",
  agent: "agent",
  fsbo: "fsbo",
  adpro: "adpro",
  pin: "listpin",
};

export function registerCheckoutProduct(id: string | null | undefined): string | null {
  if (!isRegisterCheckoutId(id)) return null;
  return REGISTER_CHECKOUT_PRODUCTS[id];
}
