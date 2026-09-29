/**
 * SamCart checkout return → /start
 *
 * Configure the SamCart product Order Redirect (Custom URL) to:
 *   https://www.talispros.com/start?orderid=##orderid##&email=##email##
 *
 * Optional custom fields (if wired in SamCart):
 *   &fastCode=##custom_fast_code##   (or fast_code / code)
 *
 * What return detection CAN do without a webhook secret:
 * - Recognize typical SamCart success query params (orderid / email)
 * - Set a browser session cookie marking this return
 * - When email (or fastCode) matches an existing Mapsite™ claim, establish
 *   the same paid owner cookies as Stripe return
 * - Best-effort upsert a talispros_payments row (provider=samcart) keyed by
 *   order id so listing unlocks / pin-shift can use hasCompletedMapSiteActivationPayment
 *
 * What it CANNOT verify without SamCart webhook/API secret:
 * - That the order actually charged (query params are forgeable)
 * - Amount, product, or refund state
 * Prefer completing the SamCart Notify URL / webhook for authoritative paid state.
 */

export const SAMCART_SUCCESS_RETURN_PATH = "/start";

/** Documented Custom URL for SamCart product Order Redirect settings. */
export const SAMCART_SUCCESS_RETURN_URL =
  "https://www.talispros.com/start?orderid=##orderid##&email=##email##";

export const SAMCART_RETURN_COOKIE = "talispros_samcart_return";
export const SAMCART_RETURN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type SamCartReturnParams = {
  orderId: string | null;
  email: string | null;
  fastCode: string | null;
};

function firstString(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  if (typeof value === "string") return value.trim() || null;
  return null;
}

/**
 * Detect SamCart (and common aliases) success query params on /start.
 * Presence of orderid (or order_id) is the primary success signal SamCart
 * substitutes via ##orderid## on Custom URL redirects.
 */
export function parseSamCartReturnParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): SamCartReturnParams {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key)?.trim() || null;
    }
    return firstString(searchParams[key]);
  };

  const orderId =
    get("orderid") ||
    get("order_id") ||
    get("orderId") ||
    get("OrderId") ||
    null;

  const emailRaw =
    get("email") || get("Email") || get("customer_email") || null;
  const email = emailRaw?.includes("@") ? emailRaw.toLowerCase() : null;

  const fastCode =
    get("fastCode") ||
    get("fast_code") ||
    get("code") ||
    get("FastCode") ||
    null;

  return {
    orderId,
    email,
    fastCode: fastCode ? fastCode.toLowerCase() : null,
  };
}

export function isSamCartPaymentReturn(params: SamCartReturnParams): boolean {
  return Boolean(params.orderId);
}

/** External order id stored in paypal_order_id until a dedicated column exists. */
export function samcartExternalOrderKey(orderId: string): string {
  const id = orderId.trim();
  if (!id) return "";
  return id.toLowerCase().startsWith("samcart:") ? id : `samcart:${id}`;
}

export function describeSamCartReturnVerification(): string {
  return (
    "Return URL params set browser paid/session state when a matching Mapsite™ " +
    "claim is found. Order charge is NOT cryptographically verified until the " +
    "SamCart webhook/Notify URL is wired with a secret."
  );
}
