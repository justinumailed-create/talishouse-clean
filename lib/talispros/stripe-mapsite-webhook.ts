import type Stripe from "stripe";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { isPlanType } from "@/lib/registration-plans";
import { activateMapSiteAfterPayment } from "@/lib/talispros/mapsite-activation";

export function stripeCheckoutSessionIsPaid(
  session: Pick<Stripe.Checkout.Session, "payment_status" | "status">
): boolean {
  return session.payment_status === "paid" && session.status === "complete";
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
  const mapsiteId = metadata.mapSiteId?.trim() || metadata.mapsiteId?.trim() || "";
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
  });
}
