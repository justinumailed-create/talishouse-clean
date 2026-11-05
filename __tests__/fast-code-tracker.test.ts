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
  it("proposes initials codes that skip taken and reserved ones", () => {
    expect(proposeFastCode("Peak Point Realty", new Set())).toBe("ppr01");
    expect(proposeFastCode("Peak Point", new Set())).toBe("pp03");
    expect(proposeFastCode("Kingdom Realty", new Set(["kr01"]))).toBe("kr02");
  });
  it("balances new codes between associates", () => {
    expect(pickLeastLoaded([{ id: "a", count: 3 }, { id: "b", count: 1 }])?.id).toBe("b");
    expect(pickLeastLoaded([{ id: "a", count: 1 }, { id: "b", count: 1 }])?.id).toBe("a");
  });
});
