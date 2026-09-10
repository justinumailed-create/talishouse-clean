import { describe, expect, it } from "vitest";
import {
  PINNED_TALISBOOK_INTERIOR_PAGE_COUNT,
  PINNED_TALISBOOK_PAGE_COUNT,
  createPinnedTalisBookViewer,
  pinnedTalisBookCoverAsset,
  pinnedTalisBookInteriorAssets,
} from "../lib/talisbooks/library/pinned-catalog";
import { getViewerSpread } from "../lib/talisbooks/viewer/spreads";

describe("pinned TalisBook sample centerfolds", () => {
  it("turns every interior landscape slide into a left/right centerfold pair", () => {
    const book = createPinnedTalisBookViewer();
    expect(book.pages).toHaveLength(PINNED_TALISBOOK_PAGE_COUNT);
    expect(book.pages[0]?.layout).toBe("cover");
    expect(book.pages[book.pages.length - 1]?.layout).toBe("cover");

    const interiors = book.pages.slice(1, -1);
    expect(interiors).toHaveLength(PINNED_TALISBOOK_INTERIOR_PAGE_COUNT * 2);

    for (let i = 0; i < interiors.length; i += 2) {
      const left = interiors[i]!;
      const right = interiors[i + 1]!;
      expect(left.layout).toBe("centerfold_left");
      expect(right.layout).toBe("centerfold_right");
      expect(left.spreadImageUrl).toBe(right.spreadImageUrl);
      expect(left.spreadImageUrl).toMatch(/\/pages\/page-\d{2}\.jpg$/);
    }
  });

  it("opens the first interior as a continuous centerfold spread", () => {
    const book = createPinnedTalisBookViewer();
    expect(book.coverSpreadOpening).toBeFalsy();

    const opening = getViewerSpread(book.pages, 0, {
      coverSpreadOpening: book.coverSpreadOpening,
      backCoverImageUrl: book.backCoverImageUrl,
    });
    expect(opening.left).toBeNull();
    expect(opening.right?.layout).toBe("cover");

    const firstInterior = getViewerSpread(book.pages, 1, {
      coverSpreadOpening: book.coverSpreadOpening,
      backCoverImageUrl: book.backCoverImageUrl,
    });
    expect(firstInterior.left?.layout).toBe("centerfold_left");
    expect(firstInterior.right?.layout).toBe("centerfold_right");
    expect(firstInterior.left?.spreadImageUrl).toBe(
      firstInterior.right?.spreadImageUrl,
    );
  });

  it("exposes a downloadable PDF of the pinned sample", () => {
    const book = createPinnedTalisBookViewer();
    expect(book.pdfDownloadUrl).toBe("/talisbooks/pinned/talispros-ebook-sample.pdf");
    expect(book.pdfDownloadFileName).toBe("TalisPros-Ebook-Sample.pdf");
  });
});

describe("pinned demonstration page assets", () => {
  it("lists eleven interior rasters with known portrait covers", () => {
    const interiors = pinnedTalisBookInteriorAssets();
    expect(interiors).toHaveLength(PINNED_TALISBOOK_INTERIOR_PAGE_COUNT);
    expect(interiors[0]?.url).toBe("/talisbooks/pinned/pages/page-01.jpg");
    expect(interiors[10]?.url).toBe("/talisbooks/pinned/pages/page-11.jpg");
    expect(interiors[0]?.width).toBeGreaterThan(interiors[0]?.height ?? 0);

    const front = pinnedTalisBookCoverAsset("front");
    const back = pinnedTalisBookCoverAsset("back");
    expect(front.height).toBeGreaterThan(front.width);
    expect(back.height).toBeGreaterThan(back.width);
    expect(front.url).toBe("/talisbooks/pinned/front-cover.jpg");
    expect(back.url).toBe("/talisbooks/pinned/back-cover.jpg");
  });
});
