import { describe, expect, it } from "vitest";
import {
  istDayEndUtc,
  pickLeastLoaded,
  proposeFastCode,
  stageAsOf,
  type FastCodeUpdate,
} from "@/lib/talispros/fast-code-tracker";

function u(createdAt: string, stage: FastCodeUpdate["stage"]): FastCodeUpdate {
  return { id: createdAt, fastCode: "ab01", agentId: null, eventType: "stage", stage, note: null, details: {}, createdBy: null, createdAt };
}

describe("FAST Code tracker (Ralf, Nov 5)", () => {
  it("reads the stage as of a past date", () => {
    const list = [u("2026-11-05T10:00:00.000Z", "demo_shown"), u("2026-11-03T10:00:00.000Z", "contacted")];
    expect(stageAsOf(list, "2026-11-04T00:00:00.000Z")).toBe("contacted");
    expect(stageAsOf(list, "2026-11-06T00:00:00.000Z")).toBe("demo_shown");
    expect(stageAsOf(list, "2026-11-01T00:00:00.000Z")).toBe("new");
  });
  it("ends an IST day at 18:30 UTC", () => {
    expect(istDayEndUtc("2026-11-05")).toBe("2026-11-05T18:30:00.000Z");
  });
  it("proposes person-initials codes and skips taken/reserved; null without a person name", () => {
    expect(proposeFastCode("Ralf Meyer", new Set())).toBe("rm01");
    expect(proposeFastCode("Hermance Mercure Laplante", new Set())).toBe("hml01");
    expect(proposeFastCode("Megan Kathleen John", new Set())).toBe("mkj01");
    expect(proposeFastCode("Patricia Place", new Set(["pp01", "pp02"]))).toBe("pp03");
    expect(proposeFastCode("Kingdom Broker", new Set(["kb01"]))).toBe("kb02");
    expect(proposeFastCode(null, new Set())).toBeNull();
    expect(proposeFastCode("", new Set())).toBeNull();
    expect(proposeFastCode("Madonna", new Set())).toBeNull();
  });
  it("balances new codes between associates", () => {
    expect(pickLeastLoaded([{ id: "a", count: 3 }, { id: "b", count: 1 }])?.id).toBe("b");
    expect(pickLeastLoaded([{ id: "a", count: 1 }, { id: "b", count: 1 }])?.id).toBe("a");
  });
});

import { ANCHOR_TOWNS, isFranchiseName, looksLikeBrokerageOffice } from "@/lib/talispros/prospect-markets";

describe("v17 Google sourcing parameters", () => {
  it("rejects franchise brokerages", () => {
    expect(isFranchiseName("RE/MAX Riverside", null)).toBe(true);
    expect(isFranchiseName("Royal LePage Atlantic", null)).toBe(true);
    expect(isFranchiseName("Anything", "https://www.century21.ca/x")).toBe(true);
    expect(isFranchiseName("Coastal Realty Ltd.", "https://coastalrealty.ca")).toBe(false);
  });
  it("keeps brokerage offices, not single agents", () => {
    expect(looksLikeBrokerageOffice("Coastal Realty Ltd.")).toBe(true);
  });
  it("anchor towns: 10k–50k, no Nova Scotia, east before west", () => {
    expect(ANCHOR_TOWNS.length).toBeGreaterThan(20);
    expect(ANCHOR_TOWNS.every((t) => (t.province as string) !== "NS" && t.population2021 >= 10000 && t.population2021 <= 50000)).toBe(true);
    expect(ANCHOR_TOWNS[0]!.lng).toBeGreaterThan(ANCHOR_TOWNS[ANCHOR_TOWNS.length - 1]!.lng);
  });
});
