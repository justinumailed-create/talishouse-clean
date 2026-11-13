import "server-only";
import {
  isRegisterCheckoutId,
  type RegisterCheckoutId,
} from "@/lib/talisu/register-checkout";

/**
 * SamCart product checkouts. Resolved only after the agent-code gate, so the
 * Register page HTML never includes these URLs. A person who already has the
 * raw link can still open SamCart directly — these addresses are public there.
 */
const REGISTER_CHECKOUT_URLS: Record<RegisterCheckoutId, string> = {
  broker: "https://talispros.mysamcart.com/checkout/broker",
  agent: "https://talispros.mysamcart.com/checkout/agent",
  fsbo: "https://talispros.mysamcart.com/checkout/fsbo",
  adpro: "https://talispros.mysamcart.com/checkout/adpro",
  pin: "https://talispros.mysamcart.com/checkout/listpin",
};

export function registerCheckoutUrl(id: string | null | undefined): string | null {
  if (!isRegisterCheckoutId(id)) return null;
  return REGISTER_CHECKOUT_URLS[id];
}
