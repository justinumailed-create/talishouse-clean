import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

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
import { stripeMapSiteIdFromCheckoutSession } from "../lib/talispros/stripe-mapsite-session";

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

describe("hasCompletedMapSiteActivationPayment lookup", () => {
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

    const { hasCompletedMapSiteActivationPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSiteActivationPayment({ mapsiteId: "map-paid" }),
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

    const { hasCompletedMapSiteActivationPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSiteActivationPayment({ mapsiteId: "map-email" }),
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

    const { hasCompletedMapSiteActivationPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSiteActivationPayment({ mapsiteId: "map-pending" }),
    ).resolves.toBe(false);
  });
});

describe("Stripe $1 Root checkout matching", () => {
  it("matches CAD $1 / $1.14 Root and rememcom@mac.com, not full Root", async () => {
    const {
      RALF_ROOT_PAYMENT_EMAIL,
      isPaidRootOneDollarCheckoutSession,
      checkoutSessionMatchesEmail,
      selectCheckoutSessionsForMapSite,
      shouldReconcileClaimedMapSiteFromStripe,
    } = await import("@/lib/talispros/stripe-root-checkout-match");

    expect(RALF_ROOT_PAYMENT_EMAIL).toBe("remecom@mac.com");
    expect(
      isPaidRootOneDollarCheckoutSession({
        payment_status: "paid",
        status: "complete",
        amount_total: 114,
        currency: "cad",
        metadata: { planType: "ROOT_ACCOUNT_1", mapSiteId: "map-1" },
        customer_email: "remecom@mac.com",
        customer_details: { email: "remecom@mac.com" },
      }),
    ).toBe(true);
    expect(
      isPaidRootOneDollarCheckoutSession({
        payment_status: "paid",
        status: "complete",
        amount_total: 113829,
        currency: "cad",
        metadata: { planType: "ROOT_ACCOUNT" },
        customer_email: "remecom@mac.com",
        customer_details: { email: "remecom@mac.com" },
      }),
    ).toBe(false);
    expect(
      checkoutSessionMatchesEmail(
        {
          customer_email: "remecom@mac.com",
          customer_details: { email: "remecom@mac.com" },
        },
        "remecom@mac.com",
      ),
    ).toBe(true);
    expect(
      selectCheckoutSessionsForMapSite(
        [
          {
            id: "cs_1",
            payment_status: "paid",
            status: "complete",
            metadata: { mapSiteId: "map-1" },
            client_reference_id: "map-1",
          } as Stripe.Checkout.Session,
        ],
        "map-1",
      ),
    ).toHaveLength(1);
    expect(
      shouldReconcileClaimedMapSiteFromStripe({
        mapsiteStatus: "BUILD_REQUEST_SUBMITTED",
      }),
    ).toBe(true);
    expect(
      shouldReconcileClaimedMapSiteFromStripe({
        mapsiteStatus: "UNCLAIMED",
      }),
    ).toBe(false);
    expect(
      shouldReconcileClaimedMapSiteFromStripe({
        isDemo: true,
        checkoutStatus: "success",
      }),
    ).toBe(false);
  });

  it("documents Ralf rm22 live Checkout ids for the heal migration", async () => {
    const { RALF_RM22_ROOT_CHECKOUT } = await import(
      "@/lib/talispros/ralf-rm22-root-checkout"
    );
    expect(RALF_RM22_ROOT_CHECKOUT.email).toBe("remecom@mac.com");
    expect(RALF_RM22_ROOT_CHECKOUT.fastCode).toBe("rm22");
    expect(RALF_RM22_ROOT_CHECKOUT.mapsiteId).toBe(
      "10d37811-43f6-4598-9ceb-d102ba6088d8",
    );
    expect(RALF_RM22_ROOT_CHECKOUT.checkoutSessionId.startsWith("cs_live_")).toBe(
      true,
    );
    expect(RALF_RM22_ROOT_CHECKOUT.amountTotalCents).toBe(114);
    expect(RALF_RM22_ROOT_CHECKOUT.claimedPath).toBe(
      "/talispros/mapsite/brokers/rm22",
    );
  });

  it("keeps the historical PayPal helper name as an alias", async () => {
    const mod = await import("@/lib/talispros/mapsite-payment");
    expect(mod.hasCompletedMapSitePaypalPayment).toBe(
      mod.hasCompletedMapSiteActivationPayment,
    );
  });
});

describe("Stripe list fallback reconciliation", () => {
  it("activates from a recent listed $1 session when Search is unavailable", async () => {
    vi.resetModules();
    const activate = vi.fn(async () => ({ success: true }));
    vi.doMock("@/lib/talispros/stripe-mapsite-webhook", async (importOriginal) => {
      const actual = await importOriginal<
        typeof import("@/lib/talispros/stripe-mapsite-webhook")
      >();
      return {
        ...actual,
        activateMapSiteFromStripeCheckoutSession: activate,
      };
    });
    vi.doMock("@/lib/supabaseAdmin", () => ({
      isSupabaseAdminConfigured: () => true,
      getSupabaseAdmin: () => ({
        from: (table: string) => {
          if (table === "talispros_payments") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                  limit: async () => ({ data: [], error: null }),
                  not: () => ({
                    limit: async () => ({ data: [], error: null }),
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
          if (table === "mapsites") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { email: "remecom@mac.com", account_id: null, fast_code: "rm01" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
              ilike: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          };
        },
      }),
    }));
    vi.doMock("@/lib/stripe", () => ({
      getStripeSecretKey: () => "sk_test_trace",
      getStripeClient: () => ({
        checkout: {
          sessions: {
            search: async () => {
              throw new Error("Search is not enabled");
            },
            list: async () => ({
              data: [
                {
                  id: "cs_ralf_root",
                  payment_status: "paid",
                  status: "complete",
                  amount_total: 114,
                  currency: "cad",
                  customer_email: "remecom@mac.com",
                  customer_details: { email: "remecom@mac.com" },
                  client_reference_id: "map-ralf",
                  metadata: {
                    mapSiteId: "map-ralf",
                    planType: "ROOT_ACCOUNT_1",
                    fastCode: "rm01",
                  },
                },
              ],
            }),
          },
        },
      }),
    }));

    const { hasCompletedMapSiteActivationPayment } = await import(
      "@/lib/talispros/mapsite-payment"
    );
    await expect(
      hasCompletedMapSiteActivationPayment({
        mapsiteId: "map-ralf",
        email: "remecom@mac.com",
        reconcileFromStripe: true,
      }),
    ).resolves.toBe(true);
    expect(activate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cs_ralf_root" }),
    );
  });
});
