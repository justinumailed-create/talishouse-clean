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
  it("uses Talishouse product images for demo listings", () => {
    const demo = createFallbackDemoMapSite();
    expect(MAPSITE_DEMO_LISTING_IMAGE).toBe(
      "/images/talishouse/recreational/400.png"
    );
    expect(MAPSITE_DEMO_GALLERY).toEqual([
      "/images/talishouse/recreational/400.png",
      "/images/talishouse/recreational/800.png",
      "/images/talishouse/residential/models/1600.png",
      "/images/talishouse/residential/hero.jpg",
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
