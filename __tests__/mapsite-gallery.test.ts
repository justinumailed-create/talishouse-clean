import { describe, expect, it } from "vitest";
import {
  galleryItemsFromLegacyUrls,
  mergeGalleryItemsWithLegacy,
  normalizeGalleryItemsForSave,
  orderGalleryItemsBySortOrder,
  parseGalleryItems,
  resolveMapsiteGalleryItems,
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

  it("keeps more than 12 gallery items when saving", () => {
    const items = Array.from({ length: 15 }, (_, index) => ({
      url: `/images/${index + 1}.png`,
      description: "",
      sortOrder: index,
      visible: true,
    }));

    const normalized = normalizeGalleryItemsForSave(items);

    expect(normalized).toHaveLength(15);
    expect(normalized.map((item) => item.sortOrder)).toEqual(
      Array.from({ length: 15 }, (_, index) => index)
    );
  });

  it("merges legacy gallery URLs missing from gallery_items", () => {
    const merged = mergeGalleryItemsWithLegacy(
      galleryItemsFromLegacyUrls(
        Array.from({ length: 12 }, (_, index) => `/legacy/${index + 1}.png`)
      ),
      [
        ...Array.from({ length: 12 }, (_, index) => `/legacy/${index + 1}.png`),
        "/legacy/13.png",
        "/legacy/14.png",
      ]
    );

    expect(merged).toHaveLength(14);
    expect(merged.at(-1)?.url).toBe("/legacy/14.png");
  });

  it("resolves gallery items from structured storage with legacy fallback", () => {
    const resolved = resolveMapsiteGalleryItems(
      [
        { url: "/a.png", description: "Front", sortOrder: 0, visible: true },
        { url: "/b.png", description: "", sortOrder: 1, visible: true },
      ],
      ["/a.png", "/b.png", "/c.png"]
    );

    expect(resolved.map((item) => item.url)).toEqual([
      "/a.png",
      "/b.png",
      "/c.png",
    ]);
    expect(resolved[0]?.description).toBe("Front");
  });
});
