import { describe, expect, it } from "vitest";
import {
  galleryItemsFromLegacyUrls,
  normalizeGalleryItemsForSave,
  orderGalleryItemsBySortOrder,
  parseGalleryItems,
  visibleGalleryDisplayItems,
} from "../lib/mapsite-gallery";

describe("mapsite-gallery", () => {
  it("parses gallery items with descriptions and visibility", () => {
    const items = parseGalleryItems([
      {
        url: "/images/a.png",
        description: "Forest trail",
        sortOrder: 1,
        visible: false,
      },
      {
        url: "/images/b.png",
        description: "Lake view",
        sortOrder: 0,
        visible: true,
      },
    ]);

    expect(items).toEqual([
      {
        url: "/images/b.png",
        description: "Lake view",
        sortOrder: 0,
        visible: true,
      },
      {
        url: "/images/a.png",
        description: "Forest trail",
        sortOrder: 1,
        visible: false,
      },
    ]);
  });

  it("returns only visible items for display", () => {
    const display = visibleGalleryDisplayItems(
      galleryItemsFromLegacyUrls(["/a.png", "/b.png"])
    );

    expect(display).toEqual([
      { url: "/a.png", description: "" },
      { url: "/b.png", description: "" },
    ]);
  });

  it("preserves array order when saving after a reorder", () => {
    const normalized = normalizeGalleryItemsForSave([
      {
        url: "/c.png",
        description: "",
        sortOrder: 2,
        visible: true,
      },
      {
        url: "/a.png",
        description: "",
        sortOrder: 0,
        visible: true,
      },
    ]);

    expect(normalized.map((item) => item.url)).toEqual(["/c.png", "/a.png"]);
    expect(normalized.map((item) => item.sortOrder)).toEqual([0, 1]);
  });

  it("sorts by sort order when loading from storage", () => {
    const ordered = orderGalleryItemsBySortOrder([
      {
        url: "/c.png",
        description: "",
        sortOrder: 9,
        visible: true,
      },
      {
        url: "/a.png",
        description: "",
        sortOrder: 2,
        visible: true,
      },
    ]);

    expect(ordered.map((item) => item.url)).toEqual(["/a.png", "/c.png"]);
  });
});
