import { describe, expect, it } from "vitest";
import {
  accountCategoryForAudience,
  audiencePlanSummary,
  buildMapSitePaymentHref,
  isMapSitePaid,
  mapsiteClaimPlanSummary,
  planTypeForAudience,
  planTypeForClaimAccountType,
  rootAccountPlanSummary,
} from "../lib/talispros/mapsite-audience";
import { mapsiteAccountTypeSegment } from "../lib/talispros/mapsite-state";

describe("Mapsite™ audience payment helpers", () => {
  it("maps audiences to account categories", () => {
    expect(accountCategoryForAudience("brokers")).toBe("root");
    expect(accountCategoryForAudience("listings")).toBe("derivative");
    expect(accountCategoryForAudience("homes")).toBe("derivative");
    expect(accountCategoryForAudience("fsbos")).toBe("adpro");
    expect(accountCategoryForAudience("adpro")).toBe("adpro");
  });

  it("always builds a Root Account PayPal register link", () => {
    const href = buildMapSitePaymentHref({
      audience: "adpro",
      mapsiteId: "abc",
      fastCode: "rc04",
      requestId: "req-1",
    });
    expect(href).toContain("/talispros/register?");
    expect(href).toContain("market=adpro");
    expect(href).toContain("account=root");
    expect(href).toContain("mapsiteId=abc");
    expect(href).toContain("request=req-1");
    expect(href).not.toContain("sponsor=");
  });

  it("keeps root payment even when a FAST code exists", () => {
    const href = buildMapSitePaymentHref({
      audience: "listings",
      mapsiteId: "abc",
      fastCode: "rc04",
    });
    expect(href).toContain("account=root");
    expect(href).not.toContain("sponsor=");
  });

  it("exposes Root Account pricing for the payment card", () => {
    expect(isMapSitePaid("ACTIVE")).toBe(true);
    expect(isMapSitePaid("BUILD_REQUEST_SUBMITTED")).toBe(false);
    expect(planTypeForAudience("brokers")).toBe("ROOT_ACCOUNT");
    expect(audiencePlanSummary("listings").planLabel).toContain("Derivative");
    expect(rootAccountPlanSummary().planLabel).toBe("Root Account™");
    expect(rootAccountPlanSummary().priceLabel).toContain("998.50");
  });

  it("maps claim root-1 and FSBO to the $1 + GST plan", () => {
    expect(planTypeForClaimAccountType("root-1")).toBe("ROOT_ACCOUNT_1");
    expect(planTypeForClaimAccountType("fsbo")).toBe("ROOT_ACCOUNT_1");
    expect(planTypeForClaimAccountType("fsbos")).toBe("ROOT_ACCOUNT_1");
    const summary = mapsiteClaimPlanSummary("ROOT_ACCOUNT_1");
    expect(summary.price).toBe(1);
    expect(summary.total).toBe(1.14);
    expect(summary.totalLabel).toContain("GST");
    expect(summary.planLabel).toContain("$1");
  });

  it("routes FSBO claimed Mapsites™ to the fsbos segment", () => {
    expect(mapsiteAccountTypeSegment("fsbo")).toBe("fsbos");
    expect(mapsiteAccountTypeSegment("fsbos")).toBe("fsbos");
  });
});
