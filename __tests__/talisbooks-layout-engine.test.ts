import { describe, expect, it } from "vitest";
import {
  classifyLayoutAsset,
  decidePlacementForAsset,
  decidePlacements,
  generateBookPagesFromUploads,
  maxPropertyPageBudget,
  minPropertyPageBudget,
  propertyPagesFitBookRules,
  type TalisBooksLayoutImageRef,
} from "../lib/talisbooks/layout-engine";
import {
  detectImageOrientation,
  shouldSplitImage,
} from "../lib/talisbooks/image-engine";

function image(
  id: string,
  width: number,
  height: number,
  overrides: Partial<TalisBooksLayoutImageRef> = {},
): TalisBooksLayoutImageRef {
  return {
    id,
    url: `https://cdn.example/${id}.jpg`,
    width,
    height,
    ...overrides,
  };
}

describe("orientation: landscape / portrait / panorama", () => {
  it("detects panorama for ultra-wide images", () => {
    expect(detectImageOrientation({ width: 2700, height: 900 })).toBe("panorama");
    expect(shouldSplitImage({ width: 2700, height: 900 })).toBe(true);
  });

  it("keeps regular landscapes splittable for centerfold", () => {
    expect(detectImageOrientation({ width: 1600, height: 900 })).toBe("landscape");
    expect(shouldSplitImage({ width: 1600, height: 900 })).toBe(true);
  });

  it("detects portrait and square", () => {
    expect(detectImageOrientation({ width: 900, height: 1600 })).toBe("portrait");
    expect(detectImageOrientation({ width: 1000, height: 1000 })).toBe("square");
  });
});

describe("classifyLayoutAsset", () => {
  it("classifies panorama, portrait, and caption flags", () => {
    const panorama = classifyLayoutAsset(image("pano", 3000, 1000));
    expect(panorama.orientation).toBe("panorama");
    expect(panorama.hasCaption).toBe(false);

    const withCaption = classifyLayoutAsset(
      image("por", 800, 1200, { caption: "Master suite" }),
    );
    expect(withCaption.orientation).toBe("portrait");
    expect(withCaption.hasCaption).toBe(true);
  });

  it("defaults mediaKind to image and accepts future kinds", () => {
    expect(classifyLayoutAsset(image("a", 100, 100)).mediaKind).toBe("image");
    expect(
      classifyLayoutAsset(image("fp", 1200, 900, { mediaKind: "floorplan" })).mediaKind,
    ).toBe("floorplan");
    expect(classifyLayoutAsset(image("doc", 800, 1100, { mediaKind: "pdf" })).mediaKind).toBe(
      "pdf",
    );
  });
});

describe("decidePlacementForAsset", () => {
  it("assigns full_bleed for panorama and landscape", () => {
    expect(decidePlacementForAsset(classifyLayoutAsset(image("p", 3000, 1000))).placement).toBe(
      "full_bleed",
    );
    expect(decidePlacementForAsset(classifyLayoutAsset(image("l", 1600, 900))).placement).toBe(
      "full_bleed",
    );
  });

  it("assigns centered for portrait and square", () => {
    expect(decidePlacementForAsset(classifyLayoutAsset(image("por", 900, 1400))).placement).toBe(
      "centered",
    );
    expect(decidePlacementForAsset(classifyLayoutAsset(image("sq", 1000, 1000))).placement).toBe(
      "centered",
    );
  });

  it("assigns caption when caption text is present", () => {
    expect(
      decidePlacementForAsset(
        classifyLayoutAsset(image("c", 1600, 900, { caption: "Sunset deck" })),
      ).placement,
    ).toBe("caption");
  });

  it("reserves centered/single for future floorplan and pdf kinds", () => {
    expect(
      decidePlacementForAsset(
        classifyLayoutAsset(image("fp", 1400, 1000, { mediaKind: "floorplan" })),
      ).placement,
    ).toBe("centered");
    expect(
      decidePlacementForAsset(classifyLayoutAsset(image("pdf", 800, 1100, { mediaKind: "pdf" })))
        .placement,
    ).toBe("single");
  });
});

describe("decidePlacements", () => {
  it("pairs two compatible landscapes into double", () => {
    const decisions = decidePlacements([
      classifyLayoutAsset(image("a", 1600, 900)),
      classifyLayoutAsset(image("b", 1800, 1000)),
    ]);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.placement).toBe("double");
    expect(decisions[0]?.assets).toHaveLength(2);
  });

  it("builds a gallery from three or more square tiles", () => {
    const decisions = decidePlacements([
      classifyLayoutAsset(image("1", 800, 800)),
      classifyLayoutAsset(image("2", 810, 800)),
      classifyLayoutAsset(image("3", 790, 800)),
      classifyLayoutAsset(image("4", 800, 810)),
    ]);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.placement).toBe("gallery");
    expect(decisions[0]?.assets).toHaveLength(4);
  });

  it("keeps panoramas as dedicated full_bleed pages", () => {
    const decisions = decidePlacements([
      classifyLayoutAsset(image("p1", 2800, 900)),
      classifyLayoutAsset(image("p2", 3000, 1000)),
    ]);

    expect(decisions).toHaveLength(2);
    expect(decisions.every((d) => d.placement === "full_bleed")).toBe(true);
  });

  it("auto-arranges derived left/right halves as a centerfold spread", () => {
    const decisions = decidePlacements([
      classifyLayoutAsset(
        image("orig", 2000, 1000, { role: "original" }),
      ),
      classifyLayoutAsset(
        image("L", 1000, 1000, {
          role: "derived_left",
          parentImageId: "orig",
          caption: "Overlook",
        }),
      ),
      classifyLayoutAsset(
        image("R", 1000, 1000, {
          role: "derived_right",
          parentImageId: "orig",
        }),
      ),
    ]);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.placement).toBe("centerfold");
    expect(decisions[0]?.assets.map((asset) => asset.id)).toEqual(["L", "R"]);
    expect(decisions[0]?.assets[0]?.hasCaption).toBe(false);
    expect(decisions[0]?.assets[1]?.caption).toBe("Overlook");
  });
});

describe("generateBookPagesFromUploads", () => {
  it("generates property pages starting at page 4 with engine-chosen placements", () => {
    const result = generateBookPagesFromUploads([
      image("hero", 3000, 1000),
      image("bath", 900, 1400, { caption: "Spa bath" }),
      image("yard", 1600, 900),
    ]);

    expect(result.pages[0]?.pageNumber).toBe(4);
    expect(result.pages.every((page) => page.content.pageRole === "property_content")).toBe(true);
    expect(result.pages.every((page) => page.content.future.supportsFloorplan)).toBe(true);
    expect(result.pages.every((page) => page.content.future.supportsPdf)).toBe(true);
    expect(result.stats.byOrientation.panorama).toBe(1);
    expect(result.stats.byOrientation.portrait).toBe(1);
  });

  it("emits two facing pages for a centerfold decision", () => {
    const result = generateBookPagesFromUploads([
      image("L", 1000, 900, {
        role: "derived_left",
        parentImageId: "src",
      }),
      image("R", 1000, 900, {
        role: "derived_right",
        parentImageId: "src",
        caption: "Morning ridge",
      }),
    ]);

    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]?.pageNumber).toBe(4);
    expect(result.pages[1]?.pageNumber).toBe(5);
    expect(result.pages[0]?.content.placement).toBe("centerfold");
    expect(result.pages[1]?.content.caption).toBe("Morning ridge");
    expect(result.pages[0]?.content.caption).toBeUndefined();
    expect(result.stats.byPlacement.centerfold).toBe(1);
  });

  it("marks pages as full bleed or centered based on placement", () => {
    const result = generateBookPagesFromUploads([
      image("pano", 3200, 1000),
      image("por", 900, 1600),
    ]);

    const bleed = result.pages.find((page) => page.content.placement === "full_bleed");
    const centered = result.pages.find((page) => page.content.placement === "centered");

    expect(bleed?.content.bleed).toBe(true);
    expect(bleed?.backgroundImageId).toBe("pano");
    expect(centered?.content.centered).toBe(true);
    expect(centered?.backgroundImageId).toBeNull();
  });

  it("skips overflow beyond the maximum property page budget", () => {
    const uploads = Array.from({ length: 30 }, (_, index) =>
      image(`img-${index}`, 3000, 1000 + (index % 3)),
    );

    const result = generateBookPagesFromUploads(uploads);
    expect(result.pages.length).toBeLessThanOrEqual(maxPropertyPageBudget());
    expect(result.skipped.length).toBeGreaterThan(0);
  });

  it("exposes official page budget helpers", () => {
    expect(minPropertyPageBudget()).toBe(8);
    expect(maxPropertyPageBudget()).toBe(18);
    expect(propertyPagesFitBookRules(8)).toBe(true);
    expect(propertyPagesFitBookRules(18)).toBe(true);
    expect(propertyPagesFitBookRules(7)).toBe(false);
    expect(propertyPagesFitBookRules(19)).toBe(false);
  });
});
