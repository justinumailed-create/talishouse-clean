import { describe, expect, it } from "vitest";
import {
  buildSelfServiceEbookPageRows,
  isSelfServiceSpreadCandidate,
  SELF_SERVICE_AGENT_PAGE,
  SELF_SERVICE_CLOSING_LANDSCAPE_START,
  SELF_SERVICE_GLASSHOUSE_START,
  SELF_SERVICE_INTERIOR_SPREAD_STARTS,
  SELF_SERVICE_LOT_PAGE,
  SELF_SERVICE_MAX_LANDSCAPE_SPREADS,
  SELF_SERVICE_TOTAL_PAGES,
} from "@/lib/talisbooks/self-service-page-plan";

describe("self-service ebook page plan", () => {
  const landscapes = Array.from({ length: 12 }, (_, i) => ({
    url: `https://cdn.example/landscape-${i + 1}.jpg`,
    width: 2400,
    height: 1200,
  }));

  it("classifies landscape vs portrait for spread candidates", () => {
    expect(isSelfServiceSpreadCandidate(2400, 1200)).toBe(true);
    expect(isSelfServiceSpreadCandidate(1200, 1800)).toBe(false);
    expect(isSelfServiceSpreadCandidate(1000, 1000)).toBe(false);
  });

  it("builds exactly 22 pages with fixed lot / glasshouse / agent slots", () => {
    const rows = buildSelfServiceEbookPageRows({
      title: "Cliff Lot",
      description: "Oceanfront acreage.",
      location: "Meat Cove, NS",
      landscapes,
      coverImageUrl: landscapes[0]!.url,
      agent: {
        name: "Alex Owner",
        phone: "902-555-0100",
        email: "alex@example.com",
      },
    });

    expect(rows).toHaveLength(SELF_SERVICE_TOTAL_PAGES);
    expect(rows.map((r) => r.page_number)).toEqual(
      Array.from({ length: SELF_SERVICE_TOTAL_PAGES }, (_, i) => i + 1),
    );

    const lot = rows.find((r) => r.page_number === SELF_SERVICE_LOT_PAGE);
    expect(lot?.content.pageRole).toBe("cover");
    expect(lot?.content.title).toBe("Cliff Lot");

    for (const start of SELF_SERVICE_INTERIOR_SPREAD_STARTS) {
      const left = rows.find((r) => r.page_number === start);
      const right = rows.find((r) => r.page_number === start + 1);
      expect(left?.content.layout).toBe("centerfold_left");
      expect(right?.content.layout).toBe("centerfold_right");
      expect(left?.content.spreadImageUrl).toBe(right?.content.spreadImageUrl);
      expect(left?.content.spreadImageUrl).toBeTruthy();
    }

    const ghLeft = rows.find((r) => r.page_number === SELF_SERVICE_GLASSHOUSE_START);
    const ghRight = rows.find(
      (r) => r.page_number === SELF_SERVICE_GLASSHOUSE_START + 1,
    );
    expect(ghLeft?.content.layout).toBe("centerfold_left");
    expect(ghRight?.content.layout).toBe("centerfold_right");
    expect(ghLeft?.content.spreadImageUrl).toBe(ghRight?.content.spreadImageUrl);
    expect(ghRight?.content.body).toBeTruthy();
    expect(ghLeft?.content.systemKey).toBe("glasshouse_brochure");

    const closeLeft = rows.find(
      (r) => r.page_number === SELF_SERVICE_CLOSING_LANDSCAPE_START,
    );
    const closeRight = rows.find(
      (r) => r.page_number === SELF_SERVICE_CLOSING_LANDSCAPE_START + 1,
    );
    expect(closeLeft?.content.spreadImageUrl).toBe(landscapes[8]!.url);
    expect(closeRight?.content.spreadImageUrl).toBe(landscapes[8]!.url);

    const agent = rows.find((r) => r.page_number === SELF_SERVICE_AGENT_PAGE);
    expect(agent?.content.pageRole).toBe("agent_brokerage");
    expect(agent?.content.agentName).toBe("Alex Owner");
  });

  it("ignores landscapes beyond the 9-spread budget and leaves empty slots blank", () => {
    const few = landscapes.slice(0, 2);
    const rows = buildSelfServiceEbookPageRows({
      title: "Small Gallery",
      description: "Two views.",
      location: "Cape Breton",
      landscapes: few,
      coverImageUrl: few[0]!.url,
      agent: { name: "Owner" },
    });

    expect(rows).toHaveLength(SELF_SERVICE_TOTAL_PAGES);

    const firstSpreadLeft = rows.find((r) => r.page_number === 2);
    const secondSpreadLeft = rows.find((r) => r.page_number === 4);
    const thirdSpreadLeft = rows.find((r) => r.page_number === 6);
    expect(firstSpreadLeft?.content.spreadImageUrl).toBe(few[0]!.url);
    expect(secondSpreadLeft?.content.spreadImageUrl).toBe(few[1]!.url);
    expect(thirdSpreadLeft?.content.spreadImageUrl).toBeUndefined();

    const closing = rows.find(
      (r) => r.page_number === SELF_SERVICE_CLOSING_LANDSCAPE_START,
    );
    expect(closing?.content.spreadImageUrl).toBeUndefined();
  });

  it("caps usable landscapes at SELF_SERVICE_MAX_LANDSCAPE_SPREADS", () => {
    expect(SELF_SERVICE_MAX_LANDSCAPE_SPREADS).toBe(9);
    const rows = buildSelfServiceEbookPageRows({
      title: "Full",
      description: "Many shots.",
      location: "NS",
      landscapes,
      coverImageUrl: landscapes[0]!.url,
      agent: { name: "Owner" },
    });

    const usedUrls = new Set(
      rows
        .filter((r) => typeof r.content.spreadImageUrl === "string")
        .map((r) => r.content.spreadImageUrl as string)
        .filter((url) => url.includes("landscape-")),
    );
    expect(usedUrls.size).toBe(9);
    expect(usedUrls.has(landscapes[9]!.url)).toBe(false);
  });
});
