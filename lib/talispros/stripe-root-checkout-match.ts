import type Stripe from "stripe";
import {
  stripeCheckoutSessionIsPaid,
  stripeMapSiteIdFromCheckoutSession,
} from "@/lib/talispros/stripe-mapsite-session";
import { normalizePaymentEmail } from "@/lib/talispros/mapsite-payment-status";
import { mapsiteActivationUnitAmountCents } from "@/lib/talispros/mapsite-activation-amount";
import { isClaimable, toPlatformStatus } from "@/lib/talispros/mapsite-state";

/** Ralf Meyer’s checkout email (not `ralf@…`). */
export const RALF_ROOT_PAYMENT_EMAIL = "remecom@mac.com";

export const ROOT_ONE_DOLLAR_PLAN_TYPE = "ROOT_ACCOUNT_1";

/** CAD $1.00 or $1.00 + 14% GST, in cents. */
export const ROOT_ONE_DOLLAR_AMOUNT_CENTS = new Set<number>([
  100,
  mapsiteActivationUnitAmountCents("ROOT_ACCOUNT_1"),
]);

export function checkoutSessionCustomerEmail(
  session: Pick<Stripe.Checkout.Session, "customer_email" | "customer_details">,
): string | null {
  return normalizePaymentEmail(
    session.customer_details?.email || session.customer_email,
  );
}

export function checkoutSessionPlanType(
  session: Pick<Stripe.Checkout.Session, "metadata">,
): string {
  return session.metadata?.planType?.trim() || "";
}

/**
 * Paid $1 Root (or FSBO, which shares ROOT_ACCOUNT_1). Does not match the
 * $998.50 full Root plan.
 */
export function isPaidRootOneDollarCheckoutSession(
  session: Pick<
    Stripe.Checkout.Session,
    | "payment_status"
    | "status"
    | "amount_total"
    | "currency"
    | "metadata"
    | "customer_email"
    | "customer_details"
  >,
): boolean {
  if (!stripeCheckoutSessionIsPaid(session)) return false;
  const planType = checkoutSessionPlanType(session);
  if (planType === "ROOT_ACCOUNT" || planType === "TEST_ACCOUNT") return false;
  if (planType === ROOT_ONE_DOLLAR_PLAN_TYPE) return true;

  const amount = session.amount_total;
  const currency = (session.currency || "").trim().toLowerCase();
  if (currency && currency !== "cad") return false;
  return typeof amount === "number" && ROOT_ONE_DOLLAR_AMOUNT_CENTS.has(amount);
}

export function checkoutSessionMatchesMapSite(
  session: {
    client_reference_id?: string | null;
    metadata?: Record<string, string> | null;
  },
  mapsiteId: string,
): boolean {
  const expected = mapsiteId.trim();
  if (!expected) return false;
  return stripeMapSiteIdFromCheckoutSession(session) === expected;
}

export function checkoutSessionMatchesEmail(
  session: Pick<Stripe.Checkout.Session, "customer_email" | "customer_details">,
  email: string,
): boolean {
  const expected = normalizePaymentEmail(email);
  const actual = checkoutSessionCustomerEmail(session);
  return Boolean(expected && actual && expected === actual);
}

export function selectCheckoutSessionsForMapSite(
  sessions: Stripe.Checkout.Session[],
  mapsiteId: string,
): Stripe.Checkout.Session[] {
  return sessions.filter(
    (session) =>
      stripeCheckoutSessionIsPaid(session) &&
      checkoutSessionMatchesMapSite(session, mapsiteId),
  );
}

export function selectPaidRootOneDollarCheckoutSessionsForEmail(
  sessions: Stripe.Checkout.Session[],
  email: string,
): Stripe.Checkout.Session[] {
  return sessions.filter(
    (session) =>
      isPaidRootOneDollarCheckoutSession(session) &&
      checkoutSessionMatchesEmail(session, email),
  );
}

/**
 * Reconcile unpaid claimed Mapsites™ (and checkout return) from Stripe.
 * Skip demo listings and unclaimed/draft public pins.
 */
export function shouldReconcileClaimedMapSiteFromStripe(options: {
  isDemo?: boolean;
  mapsiteStatus?: string | null;
  checkoutSessionId?: string | null;
  checkoutStatus?: string | null;
}): boolean {
  if (options.isDemo) return false;
  if (options.checkoutSessionId?.trim() || options.checkoutStatus === "success") {
    return true;
  }
  const platform = toPlatformStatus(options.mapsiteStatus);
  return !isClaimable(platform);
}
