import { ROUTES } from "@/lib/routes";

/**
 * "Ask for the business" interstitial (Ralf): /talisu/reg and /talisu/engage
 * first show the partner's write-up plus a Proceed button. The checkout
 * (SamCart embed) only renders once the visitor clicks Proceed, which links
 * to the same page with `?step=…` in the SAME tab. No auto-redirect.
 */
export const TALISU_ASK_STEP_PARAM = "step";
export const TALISU_REGISTER_CHECKOUT_STEP = "register";
export const TALISU_ENGAGE_CHECKOUT_STEP = "pay";

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase() || "";
}

export function isTalisURegisterCheckoutStep(
  value: string | string[] | undefined,
): boolean {
  return firstValue(value) === TALISU_REGISTER_CHECKOUT_STEP;
}

export function isTalisUEngageCheckoutStep(
  value: string | string[] | undefined,
): boolean {
  return firstValue(value) === TALISU_ENGAGE_CHECKOUT_STEP;
}

/** Aisha's Proceed → Register checkout (same tab). */
export function talisURegisterCheckoutHref(): string {
  return `${ROUTES.TALISU_REGISTER}?${TALISU_ASK_STEP_PARAM}=${TALISU_REGISTER_CHECKOUT_STEP}`;
}

/** Webster's Proceed → down-payment checkout (same tab), keeping ?product=. */
export function talisUEngageCheckoutHref(productCode?: string | null): string {
  const params = new URLSearchParams({
    [TALISU_ASK_STEP_PARAM]: TALISU_ENGAGE_CHECKOUT_STEP,
  });
  const code = productCode?.trim();
  if (code) params.set("product", code);
  return `${ROUTES.TALISU_ENGAGE}?${params.toString()}`;
}
