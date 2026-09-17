import { describe, expect, it } from "vitest";
import {
  RM22_BLEED_CAPTION,
  RM22_BLEED_IMAGE,
  RM22_BLEED_TITLE,
  RM22_COLOR,
  RM22_DOCUMENT_LEAF_WIDTH,
  RM22_DOCUMENT_PAGE_HEIGHT,
  RM22_DOCUMENT_PAGE_WIDTH,
  RM22_INTRINSIC_BODY,
  RM22_INTRINSIC_BODY_MAX_LINES,
  RM22_INTRINSIC_IMAGE,
  RM22_INTRINSIC_TITLE,
  boxToPagePercent,
  rm22IntrinsicBodyFits,
  rm22IntrinsicCaptionFits,
} from "../lib/talisbooks/rm22-layout";

describe("RM22 document coordinates", () => {
  it("keeps Intrinsic Value as a 50/50 split at the spread gutter", () => {
    expect(RM22_DOCUMENT_PAGE_WIDTH).toBe(1920);
    expect(RM22_DOCUMENT_PAGE_HEIGHT).toBe(1080);
    expect(RM22_INTRINSIC_IMAGE.box.width).toBe(RM22_DOCUMENT_LEAF_WIDTH);
    expect(RM22_INTRINSIC_IMAGE.box.x + RM22_INTRINSIC_IMAGE.box.width).toBe(
      RM22_DOCUMENT_LEAF_WIDTH,
    );
    expect(RM22_INTRINSIC_TITLE.box.x).toBe(RM22_DOCUMENT_LEAF_WIDTH);
    expect(RM22_INTRINSIC_BODY.box.x).toBeGreaterThan(RM22_DOCUMENT_LEAF_WIDTH);
    expect(
      RM22_INTRINSIC_BODY.box.x + RM22_INTRINSIC_BODY.box.width,
    ).toBeLessThanOrEqual(RM22_DOCUMENT_PAGE_WIDTH);
  });

  it("warns when Intrinsic Value body exceeds the locked text region", () => {
    const short = rm22IntrinsicBodyFits("Land plus a T-Dome.");
    expect(short.fits).toBe(true);
    const long = rm22IntrinsicBodyFits(
      Array.from({ length: RM22_INTRINSIC_BODY_MAX_LINES + 8 }, (_, i) =>
        `Paragraph ${i + 1} continues the story well past the designed copy region.`,
      ).join("\n"),
    );
    expect(long.fits).toBe(false);
    expect(long.lineCount).toBeGreaterThan(long.maxLines);
  });

  it("keeps the bleed photo slot independent of the caption overlay", () => {
    expect(RM22_BLEED_IMAGE.box.height).toBe(RM22_DOCUMENT_PAGE_HEIGHT);
    expect(RM22_BLEED_CAPTION.box.y + RM22_BLEED_CAPTION.box.height).toBe(
      RM22_DOCUMENT_PAGE_HEIGHT,
    );
    expect(RM22_BLEED_CAPTION.box.y).toBeGreaterThan(RM22_BLEED_TITLE.box.y);
    expect(RM22_BLEED_TITLE.style.color).toBe("#ffffff");
    expect(RM22_COLOR.captionOverlay).toBe("rgba(0, 0, 0, 0.3)");
    expect(RM22_BLEED_CAPTION.style.color).toBe("#ffffff");
  });

  it("maps the bleed caption across both leaves so viewer text stays spread-centered", () => {
    const left = boxToPagePercent(RM22_BLEED_CAPTION.box, {
      x: 0,
      y: 0,
      width: RM22_DOCUMENT_LEAF_WIDTH,
      height: RM22_DOCUMENT_PAGE_HEIGHT,
    });
    const right = boxToPagePercent(RM22_BLEED_CAPTION.box, {
      x: RM22_DOCUMENT_LEAF_WIDTH,
      y: 0,
      width: RM22_DOCUMENT_LEAF_WIDTH,
      height: RM22_DOCUMENT_PAGE_HEIGHT,
    });
    expect(left.left).toBe("0%");
    expect(left.width).toBe("200%");
    expect(right.left).toBe("-100%");
    expect(right.width).toBe("200%");
    expect(Number.parseFloat(left.height)).toBeGreaterThan(13);
  });

  it("converts document boxes to page-relative percents, not viewport units", () => {
    const rightLeaf = {
      x: RM22_DOCUMENT_LEAF_WIDTH,
      y: 0,
      width: RM22_DOCUMENT_LEAF_WIDTH,
      height: RM22_DOCUMENT_PAGE_HEIGHT,
    };
    const pos = boxToPagePercent(RM22_INTRINSIC_TITLE.box, rightLeaf);
    expect(pos.left).toBe("0%");
    expect(pos.width).toBe("100%");
  });

  it("warns when the Intrinsic image caption exceeds the left-leaf band", () => {
    expect(rm22IntrinsicCaptionFits("Founder").fits).toBe(true);
    expect(
      rm22IntrinsicCaptionFits(
        "A caption that keeps adding more words than the designed left-leaf band can hold without wrapping past the template region.",
      ).fits,
    ).toBe(false);
  });
});
