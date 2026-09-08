import { describe, expect, it } from "vitest";
import {
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  listingHeroImageUrl,
  listingImageUrlsFromEbookPages,
  MAPSITE_DEMO_GALLERY,
  MAPSITE_DEMO_LISTING_IMAGE,
  shouldReplaceDemoListingMedia,
  withEbookListingMedia,
} from "../lib/talispros/mapsite-listing-media";
import { createFallbackDemoMapSite } from "../lib/talispros/mapsite-platform";

describe("Mapsite™ listing media", () => {
  it("uses Glasshouse product images for demo listings", () => {
    const demo = createFallbackDemoMapSite();
    expect(MAPSITE_DEMO_LISTING_IMAGE).toBe("/images/glasshouse/hero.png");
    expect(MAPSITE_DEMO_GALLERY).toEqual([
      "/images/glasshouse/hero.png",
      "/images/glasshouse/models/200.png",
      "/images/glasshouse/models/160.png",
      "/images/glasshouse/glasshouse.png",
    ]);
    expect(getMapSiteListingHeroImage(demo)).toBe(MAPSITE_DEMO_LISTING_IMAGE);
    expect(demo.gallery_images).toEqual([...MAPSITE_DEMO_GALLERY]);
    expect(demo.cover_image).toBe(MAPSITE_DEMO_LISTING_IMAGE);
    expect(getMapSiteListingPhotoCount(demo)).toBe(4);
  });

  it("replaces legacy scenic demo media", () => {
    expect(
      shouldReplaceDemoListingMedia("/images/mapsites/lrg1-gallery/09.png", [
        "/images/mapsites/lrg1-gallery/09.png",
        "/images/mapsites/lrg1-gallery/02.png",
      ])
    ).toBe(true);

    const hero = getMapSiteListingHeroImage({
      is_demonstration: true,
      cover_image: "/images/mapsites/lrg1-gallery/09.png",
      gallery_images: [
        "/images/mapsites/lrg1-gallery/09.png",
        "/images/mapsites/lrg1-gallery/02.png",
      ],
    });
    expect(hero).toBe(MAPSITE_DEMO_LISTING_IMAGE);
  });

  it("replaces superseded Talishouse stock media on claimed listings", () => {
    expect(
      shouldReplaceDemoListingMedia("/images/talishouse/recreational/400.png", [
        "/images/talishouse/recreational/400.png",
      ])
    ).toBe(true);

    const hero = getMapSiteListingHeroImage({
      is_demonstration: false,
      cover_image: "/images/talishouse/recreational/400.png",
      gallery_images: ["/images/talishouse/recreational/400.png"],
    });
    expect(hero).toBe("/images/glasshouse/hero.png");
  });

  it("prefers the second gallery image for claimed listings", () => {
    const hero = getMapSiteListingHeroImage({
      is_demonstration: false,
      cover_image: "/cover.png",
      gallery_images: ["/gallery-first.png", "/gallery-second.png"],
    });
    expect(hero).toBe("/gallery-second.png");
  });

  it("prefers user uploads on demonstration listings after claim", () => {
    const hero = getMapSiteListingHeroImage({
      is_demonstration: true,
      cover_image: "/uploads/user-picture.jpg",
      gallery_images: ["/uploads/user-picture.jpg"],
    });
    expect(hero).toBe("/uploads/user-picture.jpg");
  });

  it("counts gallery photos for the popup badge", () => {
    expect(
      getMapSiteListingPhotoCount({
        is_demonstration: false,
        cover_image: null,
        gallery_images: ["/a.png", "/b.png"],
      })
    ).toBe(2);
  });

  it("treats Glasshouse™ stock as demo media so ebook interiors can replace it", () => {
    expect(
      shouldReplaceDemoListingMedia("/images/glasshouse/hero.png", [
        "/images/glasshouse/hero.png",
      ])
    ).toBe(true);

    const withEbook = withEbookListingMedia(
      {
        cover_image: "/images/glasshouse/hero.png",
        gallery_images: ["/images/glasshouse/hero.png"],
      },
      ["https://cdn.example/interior-1.webp", "https://cdn.example/interior-2.webp"],
    );
    expect(withEbook.cover_image).toBe("https://cdn.example/interior-2.webp");
    expect(withEbook.gallery_images).toEqual([
      "https://cdn.example/interior-2.webp",
    ]);
  });

  it("does not replace claimed custom listing photos with ebook interiors", () => {
    const kept = withEbookListingMedia(
      {
        cover_image: "/uploads/user-picture.jpg",
        gallery_images: ["/uploads/user-picture.jpg"],
      },
      ["https://cdn.example/interior-1.webp"],
    );
    expect(kept.cover_image).toBe("/uploads/user-picture.jpg");
  });

  it("uses interior ebook pages and skips covers plus Glasshouse™ stock", () => {
    expect(
      listingImageUrlsFromEbookPages([
        {
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: "https://cdn.example/front-cover.webp",
        },
        {
          pageRole: "property_content",
          layout: "centerfold_left",
          spreadImageUrl: "https://cdn.example/interior-1.webp",
        },
        {
          pageRole: "property_content",
          layout: "centerfold_right",
          spreadImageUrl: "https://cdn.example/interior-1.webp",
        },
        {
          layout: "global_content",
          systemKey: "glasshouse_brochure",
          spreadImageUrl: "/images/glasshouse/hero-hd.webp",
        },
        {
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: "https://cdn.example/back-cover.webp",
        },
      ]),
    ).toEqual(["https://cdn.example/interior-1.webp"]);
  });

  it("uses PDF page 2 / the second unique interior as the listing hero", () => {
    expect(
      listingHeroImageUrl([
        "https://cdn.example/page-1.webp",
        "https://cdn.example/page-1.webp",
        "https://cdn.example/page-2.webp",
        "https://cdn.example/page-2.webp",
      ]),
    ).toBe("https://cdn.example/page-2.webp");
  });

  it("ignores Glasshouse™ urls passed as ebook listing media", () => {
    const kept = withEbookListingMedia(
      {
        cover_image: "/images/glasshouse/hero.png",
        gallery_images: ["/images/glasshouse/hero.png"],
      },
      ["/images/glasshouse/hero-hd.webp"],
    );
    expect(kept.cover_image).toBe("/images/glasshouse/hero.png");
  });
});
