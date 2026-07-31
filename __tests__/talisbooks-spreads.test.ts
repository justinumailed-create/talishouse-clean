import { describe, expect, it } from "vitest";
import {
  describeViewerSpread,
  getViewerSpread,
  getViewerSpreadCount,
  primaryPageIndexFromSpread,
  spreadIndexFromPageIndex,
} from "../lib/talisbooks/viewer/spreads";
import type { TalisBooksViewerPage } from "../lib/talisbooks/viewer/types";

function makePages(count: number): TalisBooksViewerPage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    pageNumber: index + 1,
    pageRole: index === 0 ? "cover" : "property_content",
    title: `Page ${index + 1}`,
  }));
}

describe("TalisBooks open-book spreads", () => {
  it("counts spreads with a leading blank for the cover", () => {
    expect(getViewerSpreadCount(1)).toBe(1);
    expect(getViewerSpreadCount(2)).toBe(2);
    expect(getViewerSpreadCount(16)).toBe(9);
  });

  it("places the cover alone on the right of the first spread", () => {
    const pages = makePages(16);
    const first = getViewerSpread(pages, 0);
    expect(first.left).toBeNull();
    expect(first.right?.pageNumber).toBe(1);
  });

  it("pairs interior pages as left/right leaves", () => {
    const pages = makePages(16);
    const second = getViewerSpread(pages, 1);
    expect(second.left?.pageNumber).toBe(2);
    expect(second.right?.pageNumber).toBe(3);

    const last = getViewerSpread(pages, 8);
    expect(last.left?.pageNumber).toBe(16);
    expect(last.right).toBeNull();
  });

  it("maps page indexes to spread indexes", () => {
    expect(spreadIndexFromPageIndex(0)).toBe(0);
    expect(spreadIndexFromPageIndex(1)).toBe(1);
    expect(spreadIndexFromPageIndex(2)).toBe(1);
    expect(spreadIndexFromPageIndex(3)).toBe(2);
    expect(primaryPageIndexFromSpread(2)).toBe(3);
  });

  it("describes spreads for the controls label", () => {
    const pages = makePages(4);
    expect(describeViewerSpread(getViewerSpread(pages, 0))).toBe("Front cover");
    expect(describeViewerSpread(getViewerSpread(pages, 1))).toBe("Pages 2–3");
    expect(describeViewerSpread(getViewerSpread(pages, 2))).toBe("Back cover");
  });
});
