import type Stripe from "stripe";

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
