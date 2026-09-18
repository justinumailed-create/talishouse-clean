import { afterEach, describe, expect, it, vi } from "vitest";
import { MAPSITE_DEMO_LISTING_IMAGE } from "../lib/talispros/mapsite-listing-media";
import {
  mapsiteSatellitePreviewUrl,
  toAdminMapSiteThumbnail,
} from "../lib/talispros/mapsite-admin-thumbnail";

describe("admin Mapsite™ thumbnails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a satellite still of the live Mapsite™ camera", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_API_KEY", "test-maptiler-key");
    const url = mapsiteSatellitePreviewUrl({
      latitude: 43.8509,
      longitude: -79.337,
      zoom: 18,
    });
    expect(url).toMatch(
      /^https:\/\/api\.maptiler\.com\/tiles\/satellite-v2\/16\/\d+\/\d+\.jpg\?key=test-maptiler-key$/,
    );
  });

  it("skips the satellite still without a real MapTiler key or coordinates", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_API_KEY", "YOUR_MAPTILER_API_KEY");
    expect(
      mapsiteSatellitePreviewUrl({
        latitude: 43.85,
        longitude: -79.33,
      }),
    ).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_API_KEY", "test-maptiler-key");
    expect(
      mapsiteSatellitePreviewUrl({
        latitude: null,
        longitude: -79.33,
      }),
    ).toBeNull();
  });

  it("uses the same listing hero as the public Mapsite™ page", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPTILER_API_KEY", "test-maptiler-key");
    const item = toAdminMapSiteThumbnail({
      fast_code: "tr01",
      status: "BUILD_REQUEST_SUBMITTED",
      property_title: "8787 Woodbine Ave, Markham, ON L3R 5W9, Canada",
      property_address: "8787 Woodbine Ave, Markham, ON L3R 5W9, Canada",
      cover_image: "/cover.png",
      gallery_images: ["/gallery-first.png", "/gallery-second.png"],
      is_demonstration: false,
      latitude: 43.8509,
      longitude: -79.337,
      map_zoom: 18,
    });

    expect(item.listingHeroUrl).toBe("/gallery-second.png");
    expect(item.mapPreviewUrl).toContain("api.maptiler.com/tiles/satellite-v2/");
    expect(item.fastCode).toBe("tr01");
    expect(item.deleteControl).toBe("none");
    expect(item.paymentReceived).toBe(false);
  });

  it("falls back to the Glasshouse listing image for stock demo media", () => {
    const item = toAdminMapSiteThumbnail({
      fast_code: "ag02",
      status: "UNCLAIMED",
      property_title: null,
      cover_image: "/images/glasshouse/hero.png",
      gallery_images: ["/images/glasshouse/hero.png"],
      is_demonstration: true,
    });
    expect(item.listingHeroUrl).toBe(MAPSITE_DEMO_LISTING_IMAGE);
    expect(item.mapPreviewUrl).toBeNull();
    expect(item.deleteControl).toBe("none");
  });

  it("marks unpaid ACTIVE Mapsites™ as deletable", () => {
    const item = toAdminMapSiteThumbnail({
      fast_code: "ar01",
      status: "ACTIVE",
      property_title: "202, HW Riva",
    });
    expect(item.deleteControl).toBe("delete");
  });
});
