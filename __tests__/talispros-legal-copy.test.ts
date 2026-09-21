import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_MAPSITE_BUILD_PATH } from "../lib/talispros/demo-mapsite";
import {
  TALISPROS_HOME_MAP_FALLBACK,
  TALISPROS_HOME_MAP_RADIUS_KM,
  TALISPROS_HOME_MAPSITE_CARD,
  TALISPROS_LEGAL_PRIMARY_COPY,
  TALISPROS_LEGAL_SECONDARY_COPY,
  zoomForMapRadiusKm,
} from "../lib/talispros/start-content";
import { BUILD_MAPSITE_PREVIEW_LOCATION } from "../components/build-mapsite/home-pin-types";
import {
  MAPSITE_FLAG_IDENTITY_DEFAULT,
  allowsMapsiteFlagIdentityChoice,
  parseMapsiteFlagIdentity,
  resolveMapsiteFlagIdentity,
} from "../lib/talispros/flag-identity";

describe("Talispros legal copy and homepage products", () => {
  it("keeps the exact shared legal strings", () => {
    expect(TALISPROS_LEGAL_PRIMARY_COPY).toBe(
      "Differentiate locally and develop a real estate adjacent marketing platform by using Mapsites™️ that promote qualifying inventory.*",
    );
    expect(TALISPROS_LEGAL_SECONDARY_COPY).toBe("*Some Limitations apply");
  });

  it("explains Mapsite™ on the homepage map card", () => {
    expect("eyebrow" in TALISPROS_HOME_MAPSITE_CARD).toBe(false);
    expect(TALISPROS_HOME_MAPSITE_CARD.title).toBe("Build Mapsite™");
    expect(TALISPROS_HOME_MAPSITE_CARD.cta).toBe("Free Demo");
    expect(TALISPROS_HOME_MAPSITE_CARD.body).toBe(
      "A dedicated marketing platform covering about 50 km around all PINs you generate. Free Demo: Build Talisbooks™ and have us promote attached inventory.",
    );
    const preview = readFileSync(
      resolve("components/talispros/TalisprosHomeMapPreview.tsx"),
      "utf8",
    );
    expect(preview).toContain("href={DEMO_MAPSITE_BUILD_PATH}");
    expect(DEMO_MAPSITE_BUILD_PATH).toBe("/talispros/demo-mapsite");
  });

  it("frames the homepage map to a 50 km radius around the Claim-form Home PIN", () => {
    expect(TALISPROS_HOME_MAP_FALLBACK.latitude).toBe(
      BUILD_MAPSITE_PREVIEW_LOCATION.latitude,
    );
    expect(TALISPROS_HOME_MAP_FALLBACK.longitude).toBe(
      BUILD_MAPSITE_PREVIEW_LOCATION.longitude,
    );
    expect(TALISPROS_HOME_MAP_RADIUS_KM).toBe(50);
    expect(
      zoomForMapRadiusKm(TALISPROS_HOME_MAP_FALLBACK.latitude, 50, 627),
    ).toBe(9);
    expect(
      zoomForMapRadiusKm(TALISPROS_HOME_MAP_FALLBACK.latitude, 50, 640),
    ).toBe(9);
  });
});

describe("Choose for Flag", () => {
  it("defaults to Address and forces Address for FSBO", () => {
    expect(MAPSITE_FLAG_IDENTITY_DEFAULT).toBe("address");
    expect(parseMapsiteFlagIdentity(undefined)).toBe("address");
    expect(parseMapsiteFlagIdentity("name")).toBe("name");
    expect(
      resolveMapsiteFlagIdentity({ preference: "name", accountType: "derivative" }),
    ).toBe("name");
    expect(
      resolveMapsiteFlagIdentity({ preference: "name", accountType: "fsbo" }),
    ).toBe("address");
  });

  it("offers Address/Name only for Broker, Professional, and Adpros markets", () => {
    expect(allowsMapsiteFlagIdentityChoice("fsbo")).toBe(false);
    expect(allowsMapsiteFlagIdentityChoice("fsbos")).toBe(false);
    expect(allowsMapsiteFlagIdentityChoice("root")).toBe(true);
    expect(allowsMapsiteFlagIdentityChoice("derivative")).toBe(true);
    expect(allowsMapsiteFlagIdentityChoice("adpro")).toBe(true);
  });
});
