import { describe, expect, it } from "vitest";
import {
  BROKERAGES_PER_MARKET_TARGET,
  marketNeedsNextBrokerage,
  marketSourceGaps,
  normalizeDisqualifyReason,
  qualifiedCount,
} from "../lib/talispros/market-disqualify";

describe("market brokerage disqualification", () => {
  it("requires a short reason and does not treat a blank note as one", () => {
    expect(normalizeDisqualifyReason("  ")).toBeNull();
    expect(normalizeDisqualifyReason("no")).toBeNull();
    expect(normalizeDisqualifyReason("  Franchise office  ")).toBe("Franchise office");
  });

  it("hides a disqualified brokerage from the qualified count and flags an empty market", () => {
    const rows = [
      { id: "a", market: "Gander", status: "approved", fastCode: "aa01", disqualified: true },
      { id: "b", market: "Gander", status: "rejected", fastCode: "bb01", disqualified: false },
    ];
    expect(qualifiedCount(rows)).toBe(0);
    expect(marketNeedsNextBrokerage(rows)).toBe(true);
    expect(BROKERAGES_PER_MARKET_TARGET).toBe(3);
  });

  it("lists a market that is under the fallback of 3, and one with nobody left first", () => {
    const gaps = marketSourceGaps([
      { id: "a", market: "Bathurst", status: "approved", fastCode: "aa01", disqualified: false },
      { id: "b", market: "Gander", status: "approved", fastCode: "bb01", disqualified: true },
      { id: "c", market: "Gander", status: "pending", fastCode: "cc01", disqualified: false },
      { id: "d", market: "Gander", status: "pending", fastCode: "dd01", disqualified: true },
    ]);
    expect(gaps.find((gap) => gap.market === "Gander")).toMatchObject({ qualified: 1, needsNext: false });
    expect(gaps.find((gap) => gap.market === "Bathurst")).toMatchObject({ qualified: 1, needsNext: false });
    const ordered = marketSourceGaps([
      { id: "s", market: "Summerside", status: "approved", fastCode: "ss01", disqualified: true },
      { id: "b", market: "Bathurst", status: "approved", fastCode: "ba01", disqualified: false },
    ]);
    expect(ordered[0]).toMatchObject({ market: "Summerside", needsNext: true });
    const empty = marketSourceGaps([
      { id: "e", market: "Summerside", status: "approved", fastCode: "ee01", disqualified: true },
    ]);
    expect(empty[0]).toMatchObject({ market: "Summerside", qualified: 0, needsNext: true });
  });
});
