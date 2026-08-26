import { describe, expect, it } from "vitest";
import {
  normalizeMapSiteBackCoverToArt,
  stripTrailingBlankFacingPages,
} from "@/lib/talisbooks/viewer/cover-branding";
import type { TalisBooksViewerPage } from "@/lib/talisbooks/viewer/types";

function page(
  partial: Partial<TalisBooksViewerPage> & Pick<TalisBooksViewerPage, "id" | "pageNumber">,
): TalisBooksViewerPage {
  return {
    pageRole: "property_content",
    layout: "caption",
    title: "",
    ...partial,
  };
}

describe("normalizeMapSiteBackCoverToArt", () => {
  it("rewrites a legacy agent_summary closing leaf to pinned-style art cover", () => {
    const pages = [
      page({
        id: "front",
        pageNumber: 1,
        pageRole: "cover",
        layout: "cover",
        heroImageUrl: "/front.jpg",
        exactPdfPage: true,
      }),
      page({
        id: "agent-back",
        pageNumber: 2,
        pageRole: "agent_brokerage",
        layout: "agent_summary",
        title: "Agent details",
        agentName: "ret yuy",
        agentEmail: "test@test.com",
        brokerageName: "TALISPROS™",
        heroImageUrl: "/property.jpg",
      }),
    ];

    const next = normalizeMapSiteBackCoverToArt(pages, "/back.jpg");
    const last = next[1]!;

    expect(last.pageRole).toBe("cover");
    expect(last.layout).toBe("cover");
    expect(last.exactPdfPage).toBe(true);
    expect(last.heroImageUrl).toBe("/back.jpg");
    expect(last.agentName).toBeUndefined();
    expect(last.brokerageName).toBeUndefined();
  });

  it("leaves art-only back covers unchanged", () => {
    const pages = [
      page({
        id: "back",
        pageNumber: 1,
        pageRole: "cover",
        layout: "cover",
        heroImageUrl: "/back.jpg",
        exactPdfPage: true,
      }),
    ];

    expect(normalizeMapSiteBackCoverToArt(pages, "/other.jpg")).toEqual(pages);
  });
});

describe("stripTrailingBlankFacingPages", () => {
  it("removes blank endpaper leaves before the back cover", () => {
    const pages = [
      page({
        id: "front",
        pageNumber: 1,
        pageRole: "cover",
        layout: "cover",
        heroImageUrl: "/front.jpg",
      }),
      page({
        id: "spread",
        pageNumber: 2,
        layout: "centerfold_left",
        spreadImageUrl: "/spread.jpg",
      }),
      page({
        id: "end-left",
        pageNumber: 3,
        layout: "facing",
      }),
      page({
        id: "end-right",
        pageNumber: 4,
        layout: "facing",
      }),
      page({
        id: "back",
        pageNumber: 5,
        pageRole: "cover",
        layout: "cover",
        heroImageUrl: "/back.jpg",
      }),
    ];

    const next = stripTrailingBlankFacingPages(pages);
    expect(next).toHaveLength(4);
    expect(next.map((p) => p.id)).toEqual(["front", "spread", "end-left", "back"]);
    expect(next.at(-1)?.heroImageUrl).toBe("/back.jpg");
    expect(next.every((p, i) => p.pageNumber === i + 1)).toBe(true);
  });
});
