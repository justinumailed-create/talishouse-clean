import { describe, expect, it } from "vitest";
import {
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  MAPSITE_DEMO_GALLERY,
  MAPSITE_DEMO_LISTING_IMAGE,
  shouldReplaceDemoListingMedia,
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

  it("prefers gallery[0] for claimed listings", () => {
    const hero = getMapSiteListingHeroImage({
      is_demonstration: false,
      cover_image: "/cover.png",
      gallery_images: ["/gallery-first.png", "/gallery-second.png"],
    });
    expect(hero).toBe("/gallery-first.png");
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
});
