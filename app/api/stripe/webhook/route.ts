import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeWebhookSecret } from "@/lib/stripe";
import { activateMapSiteFromStripeCheckoutSession } from "@/lib/talispros/stripe-mapsite-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await activateMapSiteFromStripeCheckoutSession(session);
    if (!result.success) {
      console.error("[stripe-webhook] Mapsite™ activation failed:", result.error);
      return NextResponse.json(
        { error: "Activation failed." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
