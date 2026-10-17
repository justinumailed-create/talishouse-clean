import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  countryFromCoordinates,
  demoFollowUpAgent,
  parseDemoRegion,
} from "../lib/talispros/demo-built-region";

describe("Build Demo notification (Ralf Oct 17)", () => {
  it("reads province / state from Google formatted addresses", () => {
    expect(parseDemoRegion("123 King St W, Toronto, ON M5H 1A1, Canada")).toEqual({
      country: "Canada",
      region: "Ontario",
      regionCode: "ON",
    });
    expect(parseDemoRegion("Loch Lomond Rd, Nova Scotia, Canada")).toMatchObject({
      country: "Canada",
      region: "Nova Scotia",
    });
    expect(parseDemoRegion("350 5th Ave, New York, NY 10118, USA")).toMatchObject({
      country: "USA",
      region: "New York",
      regionCode: "NY",
    });
    expect(parseDemoRegion("")).toEqual({ country: null, region: null, regionCode: null });
  });

  it("routes Canada → Aritri, USA → Enanko; coordinates fallback outside the border band", () => {
    expect(demoFollowUpAgent("Canada")).toBe("Aritri");
    expect(demoFollowUpAgent("USA")).toBe("Enanko");
    expect(demoFollowUpAgent(null)).toBeNull();
    expect(countryFromCoordinates(53.5, -113.5)).toBe("Canada");
    expect(countryFromCoordinates(34.0, -118.2)).toBe("USA");
    expect(countryFromCoordinates(43.1, -79.0)).toBeNull();
  });

  it("emails arun@kyptronix.com after a demo is built, without delaying the visitor", () => {
    const notify = readFileSync(resolve("lib/talispros/demo-built-notify.ts"), "utf8");
    expect(notify).toContain('"arun@kyptronix.com"');
    expect(notify).toContain("DEMO_NOTIFY_EMAILS");
    const action = readFileSync(resolve("app/talispros/demo-mapsite/actions.ts"), "utf8");
    expect(action).toContain("after(");
    expect(action).toContain("notifyDemoBuilt(");
  });
});
