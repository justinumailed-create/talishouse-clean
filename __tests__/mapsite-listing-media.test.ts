import { describe, expect, it } from "vitest";
import {
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  MAPSITE_DEMO_LISTING_IMAGE,
} from "../lib/talispros/mapsite-listing-media";
import { createFallbackDemoMapSite } from "../lib/talispros/mapsite-platform";

describe("MapSite listing media", () => {
  it("uses the same hero image for sidebar and popup on demo listings", () => {
    const demo = createFallbackDemoMapSite();
    expect(getMapSiteListingHeroImage(demo)).toBe(MAPSITE_DEMO_LISTING_IMAGE);
    expect(demo.gallery_images[0]).toBe(MAPSITE_DEMO_LISTING_IMAGE);
    expect(demo.cover_image).toBe(MAPSITE_DEMO_LISTING_IMAGE);
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
        gallery_images: ["/a.png", "/b.png"],
      })
    ).toBe(2);
  });
});
