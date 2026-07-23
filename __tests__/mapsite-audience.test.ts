import { describe, expect, it } from "vitest";
import {
  accountCategoryForAudience,
  audiencePlanSummary,
  buildMapSitePaymentHref,
  isMapSitePaid,
  planTypeForAudience,
  rootAccountPlanSummary,
} from "../lib/talispros/mapsite-audience";

describe("MapSite audience payment helpers", () => {
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
});
