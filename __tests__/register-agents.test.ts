import { describe, expect, it } from "vitest";
import {
  buildRegisterAgentUnderRootHref,
  buildRegisterAgentsHref,
  postMapSitePaymentRedirectHref,
  REGISTER_AGENTS_PATH,
  shouldRegisterAgentsAfterPayment,
} from "@/lib/talispros/register-agents";

describe("register-agents routes", () => {
  it("builds the post-payment register-agents path with context", () => {
    expect(
      buildRegisterAgentsHref({
        fastCode: "abc1",
        mapsiteId: "map-1",
        audience: "listings",
        requestId: "req-1",
      }),
    ).toBe(
      `${REGISTER_AGENTS_PATH}?fastCode=abc1&mapsiteId=map-1&audience=listings&requestId=req-1`,
    );
  });

  it("builds derivative registration under a Root FAST Code", () => {
    expect(buildRegisterAgentUnderRootHref("lrg1")).toBe(
      "/talispros/register?plan=derivative&sponsor=lrg1",
    );
    expect(buildRegisterAgentUnderRootHref(null)).toBe(
      "/talispros/register?plan=derivative",
    );
  });

  it("sends Root/Broker to Register Agents and FSBO back to the claimed Mapsite™", () => {
    expect(
      shouldRegisterAgentsAfterPayment({
        audience: "brokers",
        accountType: "root-1",
      }),
    ).toBe(true);
    expect(
      shouldRegisterAgentsAfterPayment({
        audience: "fsbos",
        accountType: "fsbo",
      }),
    ).toBe(false);

    expect(
      postMapSitePaymentRedirectHref({
        audience: "brokers",
        accountType: "root-1",
        fastCode: "abc1",
        mapsiteId: "map-1",
        requestId: "req-1",
      }),
    ).toBe(
      `${REGISTER_AGENTS_PATH}?fastCode=abc1&mapsiteId=map-1&audience=brokers&requestId=req-1`,
    );

    expect(
      postMapSitePaymentRedirectHref({
        audience: "fsbos",
        accountType: "fsbo",
        fastCode: "ar01",
        mapsiteId: "map-1",
        requestId: "req-1",
      }),
    ).toBe("/talispros/mapsite/fsbos/ar01?view=pin&requestId=req-1&mapsiteId=map-1");
  });
});
