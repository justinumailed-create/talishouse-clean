import { describe, expect, it } from "vitest";
import {
  attachFastCodePayments,
  summarizeFastCodePayment,
} from "../lib/fast-code-admin-payment";

describe("FAST Code admin payment summary", () => {
  it("marks a completed Stripe payment by FAST code and prefers the payment intent id", () => {
    const summary = summarizeFastCodePayment(
      { code: "lrg1", mapsite_id: "map-1", request_id: "req-1" },
      [
        {
          payment_status: "completed",
          fast_code: "LRG1",
          stripe_checkout_session_id: "cs_test_abc",
          stripe_payment_intent_id: "pi_test_xyz",
        },
      ],
    );
    expect(summary.paymentSuccessful).toBe(true);
    expect(summary.stripeTransactionId).toBe("pi_test_xyz");
  });

  it("falls back to checkout session id when the payment intent is missing", () => {
    const summary = summarizeFastCodePayment(
      { code: "rd02", mapsite_id: "map-rd02" },
      [
        {
          payment_status: "paid",
          mapsite_id: "map-rd02",
          stripe_checkout_session_id: "cs_live_rd02",
        },
      ],
    );
    expect(summary.paymentSuccessful).toBe(true);
    expect(summary.stripeTransactionId).toBe("cs_live_rd02");
  });

  it("matches a completed payment by account or build-request email", () => {
    const summary = summarizeFastCodePayment(
      {
        code: "lrg1",
        email: "owner@mapsite.example",
        emails: ["RahulC@talispros.com"],
      },
      [
        {
          payment_status: "COMPLETED",
          email: "rahulc@talispros.com",
          stripe_checkout_session_id: "cs_account_match",
        },
      ],
    );
    expect(summary.paymentSuccessful).toBe(true);
    expect(summary.stripeTransactionId).toBe("cs_account_match");
  });

  it("matches a completed payment by Mapsite™ email when the FAST code is not on the payment row", () => {
    const summary = summarizeFastCodePayment(
      { code: "lrg1", email: "rahulc@talispros.com" },
      [
        {
          payment_status: "completed",
          email: "RahulC@talispros.com",
          stripe_payment_intent_id: "pi_email_match",
        },
      ],
    );
    expect(summary.paymentSuccessful).toBe(true);
    expect(summary.stripeTransactionId).toBe("pi_email_match");
  });

  it("does not treat pending payments as successful", () => {
    const [row] = attachFastCodePayments(
      [{ code: "tt03", request_id: "req-tt03" }],
      [
        {
          payment_status: "pending",
          request_id: "req-tt03",
          stripe_payment_intent_id: "pi_pending",
        },
      ],
    );
    expect(row?.paymentSuccessful).toBe(false);
    expect(row?.stripeTransactionId).toBeNull();
  });
});
