import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || "";
  return key || null;
}

export function getStripeWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
  return secret || null;
}

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
  return key || null;
}

/** Lazy client so builds do not require STRIPE_SECRET_KEY at import time. */
export function getStripeClient(): Stripe {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}
