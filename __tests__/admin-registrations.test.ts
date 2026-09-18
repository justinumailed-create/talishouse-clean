import { describe, expect, it } from "vitest";
import {
  adminRegistrationFromTalisprosPayment,
  mergeAdminRegistrationRows,
} from "../lib/admin-registrations";

describe("admin registrations from Mapsite™ payments", () => {
  it("shows a completed RM22 Stripe payment as a root account registration", () => {
    const row = adminRegistrationFromTalisprosPayment({
      id: "pay-rm22",
      email: "remecom@mac.com",
      plan_type: "ROOT_ACCOUNT_1",
      payment_status: "completed",
      fast_code: "rm22",
      stripe_payment_intent_id: "pi_3UE6jlKOU1jILB1s1QTXPuw2",
      created_at: "2026-09-10T12:00:00.000Z",
    });

    expect(row.account_type).toBe("Root Account™");
    expect(row.fast_code).toBe("rm22");
    expect(row.status).toBe("completed");
    expect(row.email).toBe("remecom@mac.com");
    expect(row.registration_number).toBe("pi_3UE6jlKOU1jILB1s1QTXPuw2");
    expect(row.markable).toBe(false);
  });

  it("fills FAST code from the linked Mapsite™ when the payment row omitted it", () => {
    const row = adminRegistrationFromTalisprosPayment(
      {
        id: "pay-1",
        email: "owner@example.com",
        plan_type: "ROOT_ACCOUNT",
        payment_status: "succeeded",
        mapsite_id: "map-1",
      },
      "LRG1",
    );
    expect(row.fast_code).toBe("LRG1");
    expect(row.account_type).toBe("Root Account™");
    expect(row.status).toBe("completed");
  });

  it("prefers the payment row when the same FAST code exists in legacy registrations", () => {
    const merged = mergeAdminRegistrationRows(
      [
        {
          id: "legacy",
          source: "registrations",
          email: "old@example.com",
          account_type: "root",
          fast_code: "RM22",
          amount_paid: 1,
          registration_number: "REG-OLD",
          status: "pending",
          created_at: "2026-01-01T00:00:00.000Z",
          markable: true,
        },
      ],
      [
        {
          id: "pay-rm22",
          source: "talispros_payment",
          email: "remecom@mac.com",
          account_type: "root",
          fast_code: "rm22",
          amount_paid: 1,
          registration_number: "pi_rm22",
          status: "completed",
          created_at: "2026-09-10T00:00:00.000Z",
          markable: false,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("pay-rm22");
    expect(merged[0]?.status).toBe("completed");
  });
});
