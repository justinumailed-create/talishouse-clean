import { describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { POST } from "@/app/api/stripe/webhook/route";
import {
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
  MAPSITE_INCLUDED_PIN_COUNT,
  MAPSITE_MAX_PIN_COUNT,
  additionalPinCheckoutQuantityError,
  additionalPinPaymentMatches,
  additionalPinPriceCents,
  canPlaceAnotherPin,
  capacityFromCounts,
  formatAdditionalPinCheckoutLabel,
  grantAdditionalPins,
  isAdditionalPinsCheckout,
  normalizePinCoordinate,
  parsePinCheckoutSessionId,
  parsePinCheckoutStatus,
  quantityFromCheckoutMetadata,
  remainingPurchasablePins,
  resolvePinQuota,
} from "@/lib/talispros/mapsite-additional-pins";
import { activateMapSiteFromStripeCheckoutSession } from "@/lib/talispros/stripe-mapsite-webhook";

vi.mock("@/lib/talispros/mapsite-activation", () => ({
  activateMapSiteAfterPayment: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/talispros/mapsite-additional-pins-service", () => ({
  fulfillAdditionalPinsFromStripeCheckoutSession: vi.fn(async () => ({
    success: true,
    pinQuota: 2,
    purchasedPins: 1,
    granted: 1,
  })),
}));

describe("Mapsite additional PIN quota", () => {
  it("starts each Mapsite with 1 included PIN", () => {
    const quota = resolvePinQuota({});
    expect(quota).toEqual({ pinQuota: 1, purchasedPins: 0 });
    expect(MAPSITE_INCLUDED_PIN_COUNT).toBe(1);
    expect(remainingPurchasablePins(quota.pinQuota)).toBe(99);
    expect(canPlaceAnotherPin(quota.pinQuota, 0)).toBe(false);
  });

  it("prices each additional PIN at $10 USD", () => {
    expect(MAPSITE_ADDITIONAL_PIN_PRICE_CENTS).toBe(1000);
    expect(additionalPinPriceCents(1)).toBe(1000);
    expect(additionalPinPriceCents(3)).toBe(3000);
    expect(formatAdditionalPinCheckoutLabel(2)).toBe("Buy 2 PINs · $20.00 USD");
    expect(
      additionalPinPaymentMatches({
        quantity: 4,
        amountTotal: 4000,
        currency: "usd",
      }),
    ).toBe(true);
    expect(
      additionalPinPaymentMatches({
        quantity: 4,
        amountTotal: 4000,
        currency: "cad",
      }),
    ).toBe(false);
    expect(
      additionalPinPaymentMatches({
        quantity: 4,
        amountTotal: 1000,
        currency: "usd",
      }),
    ).toBe(false);
  });

  it("unlocks capacity after purchase and stops at 100", () => {
    const first = grantAdditionalPins({ pinQuota: 1, purchasedPins: 0 }, 1);
    expect(first).toEqual({ pinQuota: 2, purchasedPins: 1, granted: 1 });

    const nearCap = grantAdditionalPins({ pinQuota: 98, purchasedPins: 97 }, 5);
    expect(nearCap).toEqual({ pinQuota: 100, purchasedPins: 99, granted: 2 });

    expect(grantAdditionalPins({ pinQuota: 100, purchasedPins: 99 }, 1)).toEqual({
      error: "This Mapsite already has the maximum of 100 PINs.",
    });
    expect(additionalPinCheckoutQuantityError(100, 1)).toMatch(/100/);
    expect(additionalPinCheckoutQuantityError(99, 3)).toMatch(/1 more PIN/);
    expect(MAPSITE_MAX_PIN_COUNT).toBe(100);

    const capacity = capacityFromCounts({
      pinQuota: 6,
      purchasedPins: 5,
      placedPins: 2,
    });
    expect(capacity.remainingPurchasable).toBe(94);
    expect(capacity.remainingToPlace).toBe(3);
    expect(canPlaceAnotherPin(6, 5)).toBe(false);
    expect(canPlaceAnotherPin(6, 4)).toBe(true);
  });

  it("reads Checkout metadata and rejects bad coordinates", () => {
    expect(
      isAdditionalPinsCheckout({ purpose: "additional_pins" }),
    ).toBe(true);
    expect(isAdditionalPinsCheckout({ purpose: "activation" })).toBe(false);
    expect(quantityFromCheckoutMetadata({ quantity: "3" })).toBe(3);
    expect(quantityFromCheckoutMetadata({ quantity: "0" })).toBeNull();
    expect(quantityFromCheckoutMetadata({ quantity: "100" })).toBeNull();
    expect(normalizePinCoordinate(44.1234567, "lat")).toBe(44.123457);
    expect(normalizePinCoordinate(91, "lat")).toBeNull();
    expect(normalizePinCoordinate(-181, "lng")).toBeNull();
    expect(parsePinCheckoutStatus("success")).toBe("success");
    expect(parsePinCheckoutStatus("paid")).toBeNull();
    expect(parsePinCheckoutSessionId("cs_test_123")).toBe("cs_test_123");
    expect(parsePinCheckoutSessionId("pi_test")).toBeNull();
  });
});

describe("additional PIN Checkout does not activate a Mapsite", () => {
  it("ignores additional-PIN sessions in the activation path", async () => {
    const { activateMapSiteAfterPayment } = await import(
      "@/lib/talispros/mapsite-activation"
    );
    vi.mocked(activateMapSiteAfterPayment).mockClear();
    const result = await activateMapSiteFromStripeCheckoutSession({
      id: "cs_pins",
      payment_status: "paid",
      status: "complete",
      metadata: {
        purpose: "additional_pins",
        mapSiteId: "map-1",
        quantity: "2",
      },
      client_reference_id: "map-1",
    } as unknown as Stripe.Checkout.Session);
    expect(result).toEqual({ success: true, ignored: true });
    expect(activateMapSiteAfterPayment).not.toHaveBeenCalled();
  });

  it("fulfills additional PINs from the webhook instead of activation", async () => {
    const { activateMapSiteAfterPayment } = await import(
      "@/lib/talispros/mapsite-activation"
    );
    const { fulfillAdditionalPinsFromStripeCheckoutSession } = await import(
      "@/lib/talispros/mapsite-additional-pins-service"
    );
    vi.mocked(activateMapSiteAfterPayment).mockClear();
    vi.mocked(fulfillAdditionalPinsFromStripeCheckoutSession).mockClear();

    const secret = "whsec_pin_test";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({
      id: "evt_pins",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_pins",
          object: "checkout.session",
          payment_status: "paid",
          status: "complete",
          amount_total: 2000,
          currency: "usd",
          metadata: {
            purpose: "additional_pins",
            mapSiteId: "map-1",
            quantity: "2",
            fastCode: "rm22",
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
    expect(fulfillAdditionalPinsFromStripeCheckoutSession).toHaveBeenCalledTimes(1);
    expect(activateMapSiteAfterPayment).not.toHaveBeenCalled();
  });
});
