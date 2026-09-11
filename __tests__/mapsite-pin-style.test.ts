import { describe, expect, it } from "vitest";
import { defaultHomePinLocationValues } from "@/components/build-mapsite/home-pin-types";
import {
  MAPSITE_PIN_DEFAULT_BORDER,
  MAPSITE_PIN_DEFAULT_COLOR,
  MAPSITE_PIN_DEFAULT_ICON,
  MAPSITE_PIN_DEFAULT_WHITE_CENTER,
  mapSitePinVisualFields,
  resolveMapSitePinStyle,
} from "@/lib/mapsite-pin-style";
import { pinStyleCacheKey } from "@/lib/talismaps/map-engine/pin-marker-icon";
import { toMapEnginePin } from "@/lib/talismaps/map-engine";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import type { MapSiteView } from "@/lib/mapsite-service";

describe("mapsite pin style", () => {
  it("matches the Build / Claim form PIN defaults", () => {
    expect(MAPSITE_PIN_DEFAULT_COLOR).toBe(
      defaultHomePinLocationValues.futurePinColor
    );
    expect(MAPSITE_PIN_DEFAULT_ICON).toBe(
      defaultHomePinLocationValues.futurePinIcon
    );
    expect(MAPSITE_PIN_DEFAULT_BORDER).toBe(
      defaultHomePinLocationValues.futurePinBorder
    );
    expect(MAPSITE_PIN_DEFAULT_WHITE_CENTER).toBe(
      defaultHomePinLocationValues.futurePinWhiteCenter
    );
    expect(resolveMapSitePinStyle()).toMatchObject({
      pinIcon: "none",
      pinColor: "#1A73E8",
      pinBorder: "none",
      whiteCenter: false,
      pinAnimated: false,
    });
  });

  it("shares a marker cache key with the form hollow-drop PIN", () => {
    const visual = mapSitePinVisualFields();
    const mapsitePin = toMapEnginePin({
      id: "home",
      name: "Home PIN",
      description: "",
      categoryId: null,
      categorySlug: null,
      categoryName: null,
      categoryColor: visual.categoryColor,
      latitude: 43.1,
      longitude: -79.0,
      address: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
      website: "",
      phone: "",
      email: "",
      featured: true,
      sortOrder: 0,
      pinIcon: visual.pinIcon,
      pinColor: visual.pinColor,
      pinBorder: visual.pinBorder,
      whiteCenter: visual.whiteCenter,
      pinAnimated: visual.pinAnimated,
    });

    const formPin = {
      id: "home-pin",
      latitude: 43.1,
      longitude: -79.0,
      label: "Home PIN",
      color: "#1A73E8",
      featured: true,
      metadata: {
        icon: "none",
        border: "none",
        whiteCenter: false,
        animated: false,
        categoryBadge: null,
        customLogoUrl: null,
      },
    };

    expect(pinStyleCacheKey(mapsitePin, false)).toBe(
      pinStyleCacheKey(formPin, false)
    );
  });
});

describe("published Mapsite™ hollow drop", () => {
  const baseMapSite: MapSiteView = {
    id: "mapsite-1",
    fastCode: "ar01",
    accountId: "account-1",
    slug: "ABCD",
    accountType: "root",
    ownerFirstName: "Arun",
    ownerLastName: "Rachuri",
    agentName: null,
    email: "arun@example.com",
    phone: "4165550100",
    website: null,
    status: "draft",
    propertyTitle: null,
    propertyAddress: null,
    propertyDescription: null,
    latitude: 43.65,
    longitude: -79.38,
    price: null,
    profileImageUrl: null,
    logoUrl: null,
    headerImageUrl: null,
    videoUrl: null,
    galleryImages: [],
    galleryItems: [],
    mapZoom: null,
    metaTitle: null,
    metaDescription: null,
    ogImageUrl: null,
    atlistMapUrl: null,
    offeredSubscriptionTier: "root",
    interestFormEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    mlsUrl: null,
    brokerUrl: null,
    tebUrl: null,
    ttvUrl: null,
    pins: [],
  };

  it("falls back to the form hollow-drop PIN when no pin rows exist", () => {
    const layout = buildMapSiteLayoutData(baseMapSite);
    expect(layout.pins[0]?.pinIcon).toBe("none");
    expect(layout.pins[0]?.whiteCenter).toBe(false);
    expect(layout.pins[0]?.pinColor).toBe("#1A73E8");
  });
});
