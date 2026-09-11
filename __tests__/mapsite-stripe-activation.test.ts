import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { POST } from "@/app/api/stripe/webhook/route";
import {
  MAPSITE_ACTIVATION_CURRENCY,
  mapsiteActivationUnitAmountCents,
} from "@/lib/talispros/mapsite-activation-amount";
import { parseCheckoutStatus } from "@/lib/talispros/ebook-choice";
import {
  stripeCheckoutSessionIsPaid,
  stripePaymentIntentIdFromSession,
} from "@/lib/talispros/stripe-mapsite-session";
import { registrationTotalFor } from "@/lib/registration-plans";

vi.mock("@/lib/talispros/mapsite-activation", () => ({
  activateMapSiteAfterPayment: vi.fn(async () => ({ success: true })),
}));

describe("MapSite™ Stripe activation amounts", () => {
  it("uses CAD cents from the existing registration total (including tax)", () => {
    expect(MAPSITE_ACTIVATION_CURRENCY).toBe("cad");
    expect(mapsiteActivationUnitAmountCents("ROOT_ACCOUNT_1")).toBe(
      Math.round(registrationTotalFor(1) * 100),
    );
    expect(mapsiteActivationUnitAmountCents("ROOT_ACCOUNT_1")).toBe(114);
    expect(mapsiteActivationUnitAmountCents("ROOT_ACCOUNT")).toBe(
      Math.round(registrationTotalFor(998.5) * 100),
    );
  });
});

describe("Stripe Checkout return is not activation", () => {
  it("parses checkout query without treating it as paid", () => {
    expect(parseCheckoutStatus("success")).toBe("success");
    expect(parseCheckoutStatus("cancelled")).toBe("cancelled");
    expect(parseCheckoutStatus("1")).toBeNull();
    expect(parseCheckoutStatus("paid")).toBeNull();
  });
});

describe("Stripe Checkout session payment checks", () => {
  it("requires paid + complete before activation", () => {
    expect(
      stripeCheckoutSessionIsPaid({
        payment_status: "paid",
        status: "complete",
      }),
    ).toBe(true);
    expect(
      stripeCheckoutSessionIsPaid({
        payment_status: "unpaid",
        status: "complete",
      }),
    ).toBe(false);
    expect(
      stripeCheckoutSessionIsPaid({
        payment_status: "paid",
        status: "open",
      }),
    ).toBe(false);
  });

  it("activates using client_reference_id when metadata mapsite id is missing", async () => {
    const { activateMapSiteAfterPayment } = await import(
      "@/lib/talispros/mapsite-activation"
    );
    vi.mocked(activateMapSiteAfterPayment).mockClear();
    const { activateMapSiteFromStripeCheckoutSession } = await import(
      "@/lib/talispros/stripe-mapsite-webhook"
    );
    const result = await activateMapSiteFromStripeCheckoutSession({
      id: "cs_ref",
      payment_status: "paid",
      status: "complete",
      client_reference_id: "map-from-ref",
      metadata: { requestId: "req-9", planType: "ROOT_ACCOUNT_1" },
    } as Stripe.Checkout.Session);
    expect(result.success).toBe(true);
    expect(activateMapSiteAfterPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        mapsiteId: "map-from-ref",
        requestId: "req-9",
        stripeCheckoutSessionId: "cs_ref",
      }),
    );
  });

  it("does not activate from an unpaid Checkout session", async () => {
    const { activateMapSiteAfterPayment } = await import(
      "@/lib/talispros/mapsite-activation"
    );
    vi.mocked(activateMapSiteAfterPayment).mockClear();
    const { activateMapSiteFromStripeCheckoutSession } = await import(
      "@/lib/talispros/stripe-mapsite-webhook"
    );
    const result = await activateMapSiteFromStripeCheckoutSession({
      id: "cs_unpaid",
      payment_status: "unpaid",
      status: "complete",
      metadata: { mapSiteId: "map-1" },
    } as Stripe.Checkout.Session);
    expect(result).toEqual({ success: true, ignored: true });
    expect(activateMapSiteAfterPayment).not.toHaveBeenCalled();
  });

  it("reads payment intent ids from Checkout sessions", () => {
    expect(
      stripePaymentIntentIdFromSession({ payment_intent: "pi_123" }),
    ).toBe("pi_123");
    expect(
      stripePaymentIntentIdFromSession({
        payment_intent: { id: "pi_abc" } as Stripe.PaymentIntent,
      }),
    ).toBe("pi_abc");
  });
});

describe("Stripe webhook signature", () => {
  it("rejects missing webhook secret without activating", async () => {
    const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(500);
    if (previousSecret) process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
  });

  it("rejects an invalid signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=deadbeef" },
        body: JSON.stringify({ type: "checkout.session.completed" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/invalid/i);
  });

  it("accepts a valid checkout.session.completed signature", async () => {
    const { activateMapSiteAfterPayment } = await import(
      "@/lib/talispros/mapsite-activation"
    );
    vi.mocked(activateMapSiteAfterPayment).mockClear();
    const secret = "whsec_test_secret";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          object: "checkout.session",
          payment_status: "paid",
          status: "complete",
          payment_intent: "pi_test",
          metadata: {
            mapSiteId: "map-1",
            requestId: "req-1",
            planType: "ROOT_ACCOUNT_1",
            audience: "fsbos",
          },
        },
      },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    );
    expect(response.status).toBe(200);
    expect(activateMapSiteAfterPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        mapsiteId: "map-1",
        requestId: "req-1",
        stripeCheckoutSessionId: "cs_test",
        stripePaymentIntentId: "pi_test",
      }),
    );
    expect(activateMapSiteAfterPayment).toHaveBeenCalledTimes(1);

    const duplicate = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    );
    expect(duplicate.status).toBe(200);
    expect(activateMapSiteAfterPayment).toHaveBeenCalledTimes(2);
  });
});
