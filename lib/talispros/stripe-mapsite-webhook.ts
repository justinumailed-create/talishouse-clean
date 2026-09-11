import type Stripe from "stripe";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { isPlanType } from "@/lib/registration-plans";
import { activateMapSiteAfterPayment } from "@/lib/talispros/mapsite-activation";

export function stripeCheckoutSessionIsPaid(
  session: Pick<Stripe.Checkout.Session, "payment_status" | "status">
): boolean {
  if (session.payment_status !== "paid") return false;
  return session.status === "complete" || session.status == null;
}

export function stripeMapSiteIdFromCheckoutSession(session: {
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
}): string | null {
  const metadata = session.metadata || {};
  return (
    metadata.mapSiteId?.trim() ||
    metadata.mapsiteId?.trim() ||
    session.client_reference_id?.trim() ||
    null
  );
}

export function stripePaymentIntentIdFromSession(
  session: Pick<Stripe.Checkout.Session, "payment_intent">
): string | null {
  const intent = session.payment_intent;
  if (!intent) return null;
  if (typeof intent === "string") return intent;
  return intent.id || null;
}

/**
 * checkout.session.completed → existing Mapsite™ activation service.
 */
export async function activateMapSiteFromStripeCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<{
  success: boolean;
  alreadyProcessed?: boolean;
  ignored?: boolean;
  error?: string;
}> {
  if (!stripeCheckoutSessionIsPaid(session)) {
    return { success: true, ignored: true };
  }

  const metadata = session.metadata || {};
  const mapsiteId = stripeMapSiteIdFromCheckoutSession(session) || "";
  const requestId = metadata.requestId?.trim() || null;
  const planType = isPlanType(metadata.planType) ? metadata.planType : null;
  const audience = parseRegistrationMarket(metadata.audience) || metadata.audience || null;

  if (!mapsiteId) {
    return { success: false, error: "Checkout session is missing mapsiteId." };
  }

  return activateMapSiteAfterPayment({
    mapsiteId,
    requestId,
    audience,
    planType,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: stripePaymentIntentIdFromSession(session),
    fastCode: metadata.fastCode?.trim() || null,
  });
}
