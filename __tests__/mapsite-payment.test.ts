import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {},
}));

vi.mock("@/lib/talispros/stripe-mapsite-webhook", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/talispros/stripe-mapsite-webhook")
  >();
  return {
    ...actual,
    activateMapSiteFromStripeCheckoutSession: vi.fn(async () => ({
      success: true,
      alreadyProcessed: true,
    })),
  };
});

import {
  isCompletedTalisprosPaymentStatus,
  normalizePaymentEmail,
} from "../lib/talispros/mapsite-payment-status";
import {
  parseCheckoutSessionId,
  parseCheckoutStatus,
} from "../lib/talispros/ebook-choice";
import { stripeMapSiteIdFromCheckoutSession } from "../lib/talispros/stripe-mapsite-webhook";

describe("Mapsite™ payment status helpers", () => {
  it("treats completed, paid, complete, and succeeded as paid", () => {
    expect(isCompletedTalisprosPaymentStatus("completed")).toBe(true);
    expect(isCompletedTalisprosPaymentStatus("COMPLETED")).toBe(true);
    expect(isCompletedTalisprosPaymentStatus("paid")).toBe(true);
    expect(isCompletedTalisprosPaymentStatus("complete")).toBe(true);
    expect(isCompletedTalisprosPaymentStatus("succeeded")).toBe(true);
    expect(isCompletedTalisprosPaymentStatus("pending")).toBe(false);
    expect(isCompletedTalisprosPaymentStatus("open")).toBe(false);
    expect(isCompletedTalisprosPaymentStatus(null)).toBe(false);
  });

  it("normalizes payment emails", () => {
    expect(normalizePaymentEmail(" Ralf@Example.com ")).toBe("ralf@example.com");
    expect(normalizePaymentEmail("")).toBeNull();
    expect(normalizePaymentEmail("not-an-email")).toBeNull();
  });

  it("parses Stripe Checkout session ids from the return URL", () => {
    expect(parseCheckoutSessionId("cs_test_abc123")).toBe("cs_test_abc123");
    expect(parseCheckoutSessionId("{CHECKOUT_SESSION_ID}")).toBeNull();
    expect(parseCheckoutSessionId("not-a-session")).toBeNull();
    expect(parseCheckoutStatus("success")).toBe("success");
  });

  it("reads mapsite id from metadata or client_reference_id", () => {
    expect(
      stripeMapSiteIdFromCheckoutSession({
        metadata: { mapSiteId: "map-1" },
        client_reference_id: "ignored",
      }),
    ).toBe("map-1");
    expect(
      stripeMapSiteIdFromCheckoutSession({
        metadata: {},
        client_reference_id: "map-2",
      }),
    ).toBe("map-2");
  });
});

describe("hasCompletedMapSitePaypalPayment lookup", () => {
  const paymentsEq = vi.fn();
  const paymentsIn = vi.fn();
  const paymentsIlike = vi.fn();
  const mapsitesEq = vi.fn();
  const requestsEq = vi.fn();
  const fastCodesIlike = vi.fn();
  const accountsEq = vi.fn();
  const requestsLinkedEq = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    paymentsEq.mockReset();
    paymentsIn.mockReset();
    paymentsIlike.mockReset();
    mapsitesEq.mockReset();
    requestsEq.mockReset();
    fastCodesIlike.mockReset();
    accountsEq.mockReset();
    requestsLinkedEq.mockReset();
  });

  function paymentQuery() {
    return {
      select: () => ({
        eq: (column: string, value: string) => {
          paymentsEq(column, value);
          const result =
            column === "mapsite_id" && value === "map-paid"
              ? {
                  data: [{ id: "pay-1", payment_status: "completed" }],
                  error: null,
                }
              : column === "stripe_checkout_session_id" && value === "cs_paid"
                ? {
                    data: { id: "pay-1", payment_status: "completed" },
                    error: null,
                  }
                : { data: column === "stripe_checkout_session_id" ? null : [], error: null };
          if (column === "stripe_checkout_session_id") {
            return {
              maybeSingle: async () => result,
            };
          }
          return {
            limit: async () => result,
          };
        },
        ilike: (column: string, value: string) => {
          paymentsIlike(column, value);
          return {
            limit: async () => ({ data: [], error: null }),
          };
        },
        in: (column: string, values: string[]) => {
          paymentsIn(column, values);
          const paid = values.includes("ralf@example.com");
          return {
            limit: async () => ({
              data: paid
                ? [{ id: "pay-email", payment_status: "completed", email: "ralf@example.com" }]
                : [],
              error: null,
            }),
          };
        },
      }),
    };
  }

  function mockFrom(table: string) {
    if (table === "talispros_payments") return paymentQuery();
    if (table === "mapsites") {
      return {
        select: () => ({
          eq: (_column: string, id: string) => {
            mapsitesEq(id);
            return {
              maybeSingle: async () => ({
                data:
                  id === "map-email"
                    ? { email: "demo@talispros.com", account_id: "acct-1", fast_code: "rf01" }
                    : { email: "", account_id: null, fast_code: null },
                error: null,
              }),
            };
          },
        }),
      };
    }
    if (table === "build_requests") {
      return {
        select: () => ({
          eq: (column: string, value: string) => {
            if (column === "linked_mapsite_id") {
              requestsLinkedEq(value);
              return {
                order: () => ({
                  limit: async () => ({
                    data:
                      value === "map-email"
                        ? [
                            {
                              id: "req-1",
                              email: "ralf@example.com",
                              requested_fast_code: "rf01",
                            },
                          ]
                        : [],
                    error: null,
                  }),
                }),
              };
            }
            requestsEq(value);
            return {
              maybeSingle: async () => ({
                data: {
                  email: "ralf@example.com",
                  linked_mapsite_id: "map-email",
                  requested_fast_code: "rf01",
                },
                error: null,
              }),
            };
          },
        }),
      };
    }
    if (table === "fast_codes") {
      return {
        select: () => ({
          ilike: (_column: string, value: string) => {
            fastCodesIlike(value);
            return {
              maybeSingle: async () => ({ data: null, error: null }),
            };
          },
        }),
      };
    }
    if (table === "accounts") {
      return {
        select: () => ({
          eq: () => {
            accountsEq();
            return {
              maybeSingle: async () => ({ data: null, error: null }),
            };
          },
        }),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  }

  it("unlocks when a completed payment is linked to the mapsite id", async () => {
    vi.doMock("@/lib/supabaseAdmin", () => ({
      isSupabaseAdminConfigured: () => true,
      getSupabaseAdmin: () => ({ from: mockFrom }),
    }));
    vi.doMock("@/lib/stripe", () => ({
      getStripeSecretKey: () => null,
      getStripeClient: () => {
        throw new Error("stripe should not be called");
      },
    }));

    const { hasCompletedMapSitePaypalPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSitePaypalPayment({ mapsiteId: "map-paid" }),
    ).resolves.toBe(true);
  });

  it("unlocks from the claim email even when mapsite.email does not match", async () => {
    vi.doMock("@/lib/supabaseAdmin", () => ({
      isSupabaseAdminConfigured: () => true,
      getSupabaseAdmin: () => ({ from: mockFrom }),
    }));
    vi.doMock("@/lib/stripe", () => ({
      getStripeSecretKey: () => null,
      getStripeClient: () => {
        throw new Error("stripe should not be called");
      },
    }));

    const { hasCompletedMapSitePaypalPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSitePaypalPayment({ mapsiteId: "map-email" }),
    ).resolves.toBe(true);
    expect(paymentsIn).toHaveBeenCalledWith(
      "email",
      expect.arrayContaining(["ralf@example.com"]),
    );
  });

  it("does not unlock from a pending payment row", async () => {
    vi.doMock("@/lib/supabaseAdmin", () => ({
      isSupabaseAdminConfigured: () => true,
      getSupabaseAdmin: () => ({
        from: (table: string) => {
          if (table === "talispros_payments") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "pay-pending", payment_status: "pending" },
                    error: null,
                  }),
                  limit: async () => ({
                    data: [{ id: "pay-pending", payment_status: "pending" }],
                    error: null,
                  }),
                }),
                ilike: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
                in: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            };
          }
          return mockFrom(table);
        },
      }),
    }));
    vi.doMock("@/lib/stripe", () => ({
      getStripeSecretKey: () => null,
      getStripeClient: () => {
        throw new Error("stripe should not be called");
      },
    }));

    const { hasCompletedMapSitePaypalPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSitePaypalPayment({ mapsiteId: "map-pending" }),
    ).resolves.toBe(false);
  });
});
