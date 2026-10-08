import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
  MAPSITE_MAX_FREE_PIN_CREDITS,
  applyFreePinGrant,
  capacityFromCounts,
  clampFreePinCredits,
  defaultMapSitePinDashboard,
  freePinGrantDeltaError,
  splitFreeAndPaidPins,
} from "@/lib/talispros/mapsite-additional-pins";

const mocks = vi.hoisted(() => ({
  readMapSiteForPinPurchase: vi.fn(),
  redeemFreePinCredits: vi.fn(),
  loadMapSitePinDashboard: vi.fn(),
  recordPendingPinPurchase: vi.fn(async () => undefined),
  sessionsCreate: vi.fn(),
  stripeKey: { value: "sk_test_123" as string | null },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "talishouse.test", "x-forwarded-proto": "https" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/mapsite-edit-auth", () => ({
  requireMapSiteEditAccess: vi.fn(async () => undefined),
}));
vi.mock("@/lib/stripe", () => ({
  getStripeSecretKey: () => mocks.stripeKey.value,
  getStripeClient: () => ({ checkout: { sessions: { create: mocks.sessionsCreate } } }),
}));
vi.mock("@/lib/talispros/mapsite-additional-pins-service", () => ({
  fixAdditionalPinRecord: vi.fn(),
  fulfillAdditionalPinsFromStripeCheckoutSession: vi.fn(),
  loadMapSitePinDashboard: mocks.loadMapSitePinDashboard,
  mapsiteCannotSellAdditionalPins: () => null,
  placeAdditionalPinRecord: vi.fn(),
  readMapSiteForPinPurchase: mocks.readMapSiteForPinPurchase,
  recordPendingPinPurchase: mocks.recordPendingPinPurchase,
  redeemFreePinCredits: mocks.redeemFreePinCredits,
}));

import { createAdditionalPinCheckout } from "@/app/talispros/mapsite/pin-actions";

function mapsiteRow(freePinCredits: number, pinQuota = 1) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    fastCode: "ab12",
    email: "owner@example.com",
    accountType: "realtor",
    isDemonstration: false,
    pinQuota,
    purchasedPins: 0,
    freePinCredits,
  };
}

describe("free PIN credit math", () => {
  it("uses free credits first, then $7 CAD for the rest", () => {
    expect(splitFreeAndPaidPins(3, 5)).toEqual({ free: 3, paid: 0, paidCents: 0 });
    expect(splitFreeAndPaidPins(5, 2)).toEqual({
      free: 2,
      paid: 3,
      paidCents: 3 * MAPSITE_ADDITIONAL_PIN_PRICE_CENTS,
    });
    expect(splitFreeAndPaidPins(4, 0)).toEqual({ free: 0, paid: 4, paidCents: 2800 });
    expect(splitFreeAndPaidPins(0, 5)).toEqual({ free: 0, paid: 0, paidCents: 0 });
    expect(splitFreeAndPaidPins(2, null)).toEqual({ free: 0, paid: 2, paidCents: 1400 });
  });

  it("clamps balances to 0..99", () => {
    expect(clampFreePinCredits(-3)).toBe(0);
    expect(clampFreePinCredits(150)).toBe(MAPSITE_MAX_FREE_PIN_CREDITS);
    expect(clampFreePinCredits(undefined)).toBe(0);
    expect(applyFreePinGrant(95, 10)).toEqual({ freePinCredits: 99, applied: 4 });
    expect(applyFreePinGrant(2, -5)).toEqual({ freePinCredits: 0, applied: -2 });
    expect(applyFreePinGrant(0, 5)).toEqual({ freePinCredits: 5, applied: 5 });
  });

  it("validates admin grant counts", () => {
    expect(freePinGrantDeltaError(5)).toBeNull();
    expect(freePinGrantDeltaError(-2)).toBeNull();
    expect(freePinGrantDeltaError(0)).toMatch(/whole number/);
    expect(freePinGrantDeltaError(1.5)).toMatch(/whole number/);
    expect(freePinGrantDeltaError(100)).toMatch(/at most 99/);
  });

  it("exposes the free balance on the PIN dashboard state", () => {
    expect(defaultMapSitePinDashboard().freePinCredits).toBe(0);
    expect(capacityFromCounts({ placedPins: 0, freePinCredits: 7 }).freePinCredits).toBe(7);
  });
});

describe("createAdditionalPinCheckout with free credits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.stripeKey.value = "sk_test_123";
    mocks.loadMapSitePinDashboard.mockResolvedValue(
      capacityFromCounts({ pinQuota: 4, placedPins: 0, freePinCredits: 2 }),
    );
    mocks.redeemFreePinCredits.mockImplementation(async ({ quantity }) => ({
      success: true,
      redeemed: quantity,
    }));
    mocks.sessionsCreate.mockResolvedValue({
      id: "cs_test_abc",
      url: "https://checkout.stripe.com/c/pay/cs_test_abc",
    });
  });

  it("skips Stripe entirely when credits cover the quantity", async () => {
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(5));
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(5).id,
      fastCode: "AB12",
      quantity: 3,
    });
    expect(result.error).toBeUndefined();
    expect(result.url).toBeUndefined();
    expect(result.freeRedeemed).toBe(3);
    expect(result.dashboard?.freePinCredits).toBe(2);
    expect(mocks.redeemFreePinCredits).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3, fastCode: "ab12" }),
    );
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("works without Stripe configured when fully free", async () => {
    mocks.stripeKey.value = null;
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(1));
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(1).id,
      fastCode: "ab12",
      quantity: 1,
    });
    expect(result.freeRedeemed).toBe(1);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it("redeems credits then charges $7 CAD only for the remainder", async () => {
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(2));
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(2).id,
      fastCode: "ab12",
      quantity: 5,
    });
    expect(result.url).toContain("checkout.stripe.com");
    expect(result.freeRedeemed).toBe(2);
    expect(mocks.redeemFreePinCredits).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 2 }),
    );
    const params = mocks.sessionsCreate.mock.calls[0][0];
    expect(params.line_items[0].quantity).toBe(3);
    expect(params.line_items[0].price_data.currency).toBe("cad");
    expect(params.line_items[0].price_data.unit_amount).toBe(700);
    expect(params.metadata.quantity).toBe("3");
    expect(params.metadata.freeQuantity).toBe("2");
    expect(mocks.recordPendingPinPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3, stripeCheckoutSessionId: "cs_test_abc" }),
    );
  });

  it("charges the full quantity when there are no credits", async () => {
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(0));
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(0).id,
      fastCode: "ab12",
      quantity: 4,
    });
    expect(result.freeRedeemed).toBe(0);
    expect(mocks.redeemFreePinCredits).not.toHaveBeenCalled();
    expect(mocks.sessionsCreate.mock.calls[0][0].line_items[0].quantity).toBe(4);
  });

  it("does not redeem credits when Stripe is needed but missing", async () => {
    mocks.stripeKey.value = null;
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(2));
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(2).id,
      fastCode: "ab12",
      quantity: 5,
    });
    expect(result.error).toMatch(/Stripe is not configured/);
    expect(mocks.redeemFreePinCredits).not.toHaveBeenCalled();
  });

  it("surfaces a failed redemption without starting Stripe", async () => {
    mocks.readMapSiteForPinPurchase.mockResolvedValue(mapsiteRow(3));
    mocks.redeemFreePinCredits.mockResolvedValueOnce({
      success: false,
      error: "Not enough free PIN credits.",
    });
    const result = await createAdditionalPinCheckout({
      mapsiteId: mapsiteRow(3).id,
      fastCode: "ab12",
      quantity: 2,
    });
    expect(result.error).toBe("Not enough free PIN credits.");
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });
});
