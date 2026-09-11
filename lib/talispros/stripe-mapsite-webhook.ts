import type Stripe from "stripe";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { isPlanType } from "@/lib/registration-plans";
import { activateMapSiteAfterPayment } from "@/lib/talispros/mapsite-activation";
import {
  stripeCheckoutSessionIsPaid,
  stripeMapSiteIdFromCheckoutSession,
  stripePaymentIntentIdFromSession,
} from "@/lib/talispros/stripe-mapsite-session";

export {
  stripeCheckoutSessionIsPaid,
  stripeMapSiteIdFromCheckoutSession,
  stripePaymentIntentIdFromSession,
} from "@/lib/talispros/stripe-mapsite-session";

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
