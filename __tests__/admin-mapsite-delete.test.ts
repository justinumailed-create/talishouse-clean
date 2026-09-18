import { describe, expect, it } from "vitest";
import { paymentProtectsMapSiteFromDelete } from "../lib/fast-code-admin-payment";
import { adminMapSiteDeleteControl } from "../lib/talispros/admin-mapsite-delete";

describe("admin Mapsite™ delete controls", () => {
  it("offers delete on active unpaid Mapsites™", () => {
    expect(
      adminMapSiteDeleteControl({ status: "ACTIVE", paymentReceived: false }),
    ).toBe("delete");
    expect(
      adminMapSiteDeleteControl({ status: "active", paymentReceived: false }),
    ).toBe("delete");
  });

  it("locks paid active Mapsites™ like rm22", () => {
    expect(
      adminMapSiteDeleteControl({ status: "ACTIVE", paymentReceived: true }),
    ).toBe("lock");
  });

  it("hides delete on Mapsites™ that are not ACTIVE", () => {
    expect(
      adminMapSiteDeleteControl({
        status: "UNCLAIMED",
        paymentReceived: false,
      }),
    ).toBe("none");
    expect(
      adminMapSiteDeleteControl({
        status: "BUILD_REQUEST_SUBMITTED",
        paymentReceived: true,
      }),
    ).toBe("none");
  });

  it("protects by FAST code or Mapsite™ id, not a shared email", () => {
    const payments = [
      {
        payment_status: "completed",
        fast_code: "rm22",
        mapsite_id: "paid-map",
        email: "owner@example.com",
      },
    ];
    expect(
      paymentProtectsMapSiteFromDelete(
        { id: "paid-map", fastCode: "rm22" },
        payments,
      ),
    ).toBe(true);
    expect(
      paymentProtectsMapSiteFromDelete(
        { id: "other-map", fastCode: "ar01" },
        payments,
      ),
    ).toBe(false);
  });
});
