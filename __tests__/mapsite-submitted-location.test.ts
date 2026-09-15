import { describe, expect, it } from "vitest";
import {
  applyBuildRequestLocationToMapSite,
  createFallbackDemoMapSite,
} from "@/lib/talispros/mapsite-platform";

describe("Mapsite™ submitted location merge", () => {
  it("replaces demo coordinates and address with Build Request values", () => {
    const demo = createFallbackDemoMapSite({
      status: "BUILD_REQUEST_SUBMITTED",
      fast_code: "AR08",
    });

    const merged = applyBuildRequestLocationToMapSite(demo, {
      latitude: 22.5882834,
      longitude: 88.4734476,
      propertyAddress: "New Town, Kolkata, India",
      propertyTitle: "Custom Lot",
      propertyDescription: "User PIN write-up from the claim form.",
      coverImage: "https://cdn.example/user-photo.jpg",
      galleryImages: ["https://cdn.example/user-photo.jpg"],
      pinIcon: "flag",
      pinColor: "#1A73E8",
      pinWhiteCenter: false,
    });

    expect(merged.lat).toBe(22.5882834);
    expect(merged.lng).toBe(88.4734476);
    expect(merged.property_address).toBe("New Town, Kolkata, India");
    expect(merged.property_title).toBe("Custom Lot");
    expect(merged.property_description).toBe(
      "User PIN write-up from the claim form."
    );
    expect(merged.cover_image).toBe("https://cdn.example/user-photo.jpg");
    expect(merged.pin_icon).toBe("flag");
    expect(merged.pin_color).toBe("#1A73E8");
    expect(merged.pin_white_center).toBe(false);
    expect(merged.pin_animated).toBe(false);
  });

  it("does not copy a personal name onto the Mapsite™ title", () => {
    const demo = createFallbackDemoMapSite({
      status: "BUILD_REQUEST_SUBMITTED",
      fast_code: "LG02",
      property_title: "Lydia Gaertner",
    });

    const merged = applyBuildRequestLocationToMapSite(demo, {
      latitude: 46.088,
      longitude: -59.882,
      propertyAddress: "5 HEAD RD, HOMEVILLE, NS, CANADA",
      propertyTitle: "Lydia Gaertner",
      propertyDescription: null,
      coverImage: null,
      galleryImages: [],
      pinIcon: "flag",
      pinColor: "#1A73E8",
      pinWhiteCenter: false,
    });

    expect(merged.property_title).toBe("5 HEAD RD, HOMEVILLE, NS, CANADA");
    expect(merged.property_title).not.toMatch(/Lydia/i);
  });
});
