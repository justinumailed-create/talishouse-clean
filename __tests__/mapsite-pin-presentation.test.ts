import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  distanceMeters,
  mapsitePinFitPadding,
  presentMapSitePins,
  shiftCameraForNeighbors,
} from "../lib/talispros/mapsite-pin-presentation";

const RM22 = { latitude: 45.6617996, longitude: -60.7053943 };
const BLANK = {
  id: "blank",
  latitude: 45.661728,
  longitude: -60.703511,
  label: "",
};
const ESK = {
  id: "esk",
  latitude: 46.02873,
  longitude: -60.374977,
  label: "342 Eskasoni Rd., Northside East Bay, NS",
};

describe("eBook pin becomes the main pin", () => {
  it("puts RM22's unlabeled nearby pin at the main spot and keeps the geocode as an address pin", () => {
    const pins = presentMapSitePins({
      mapsiteId: "rm22",
      ...RM22,
      mainLabel: "160 Macs Rd, Richmond County, NS B0E 3B0, Canada",
      addressLabel: "160 Macs Rd, Richmond County, NS B0E 3B0, Canada",
      hasEbook: true,
      blankLabel: "Pinned location",
      additional: [ESK, BLANK],
    });
    const main = pins.find((pin) => pin.role === "main");
    const address = pins.find((pin) => pin.role === "address");
    expect(main?.latitude).toBe(BLANK.latitude);
    expect(main?.longitude).toBe(BLANK.longitude);
    expect(main?.label).toContain("160 Macs");
    expect(pins.some((pin) => pin.id === "blank")).toBe(false);
    expect(address?.latitude).toBe(RM22.latitude);
    expect(address?.label).toContain("160 Macs");
    expect(distanceMeters(RM22, BLANK)).toBeGreaterThan(100);
    expect(distanceMeters(RM22, BLANK)).toBeLessThan(400);
  });

  it("leaves DC06 alone when there is no extra pin", () => {
    const pins = presentMapSitePins({
      mapsiteId: "dc06",
      latitude: 45.69,
      longitude: -60.62,
      mainLabel: "Loch Lomond Rd",
      addressLabel: "Loch Lomond Rd",
      hasEbook: true,
      blankLabel: "Pinned location",
      additional: [],
    });
    expect(pins).toHaveLength(1);
    expect(pins[0]?.role).toBe("main");
    expect(pins[0]?.latitude).toBe(45.69);
  });

  it("does not promote a blank pin that is far away, and gives it a label", () => {
    const far = { id: "far", latitude: 46.2, longitude: -60.2, label: " " };
    const pins = presentMapSitePins({
      mapsiteId: "x",
      ...RM22,
      mainLabel: "Main",
      addressLabel: "Main",
      hasEbook: true,
      blankLabel: "Pinned location",
      additional: [far],
    });
    expect(pins.find((pin) => pin.role === "main")?.latitude).toBe(RM22.latitude);
    expect(pins.find((pin) => pin.id === "far")?.label).toBe("Pinned location");
  });

  it("nudges a pin that would stack on its neighbor", () => {
    const pins = presentMapSitePins({
      mapsiteId: "rm22",
      ...RM22,
      mainLabel: "Main",
      addressLabel: "Address",
      hasEbook: true,
      blankLabel: "Pinned location",
      additional: [BLANK],
    });
    const nudged = pins.filter((pin) => pin.screenNudgeX > 0);
    expect(nudged).toHaveLength(1);
    expect(nudged[0]?.role).toBe("address");
  });

  it("pads the opening view for the owner card and Aisha", () => {
    const desktop = mapsitePinFitPadding({ width: 1440, compact: false });
    expect(desktop.left).toBeGreaterThan(300);
    expect(desktop.bottom).toBeGreaterThanOrEqual(320);
    expect(desktop.right).toBeGreaterThan(200);
    const phone = mapsitePinFitPadding({ width: 390, compact: true });
    expect(phone.left).toBeLessThan(40);
    expect(phone.bottom).toBeGreaterThanOrEqual(320);
  });

  it("does not promote when there is no eBook or when two blank pins are close", () => {
    const shared = {
      mapsiteId: "x",
      ...RM22,
      mainLabel: "Main",
      addressLabel: "Main",
      blankLabel: "Pinned location",
      additional: [BLANK],
    };
    expect(
      presentMapSitePins({ ...shared, hasEbook: false }).find((pin) => pin.role === "main")
        ?.latitude,
    ).toBe(RM22.latitude);
    const two = presentMapSitePins({
      ...shared,
      hasEbook: true,
      additional: [BLANK, { ...BLANK, id: "blank-2", longitude: -60.7032 }],
    });
    expect(two.find((pin) => pin.role === "main")?.latitude).toBe(RM22.latitude);
    expect(two.some((pin) => pin.id === "blank")).toBe(true);
  });

  it("slides a neighbor that sits under the right-hand overlay back into the clear area", () => {
    const camera = { latitude: 45.66, longitude: -60.7 };
    const next = shiftCameraForNeighbors({
      camera,
      zoom: 14,
      neighbors: [{ latitude: 45.66, longitude: -60.6 }],
      width: 1440,
      height: 800,
      padding: mapsitePinFitPadding({ width: 1440, compact: false }),
    });
    expect(next.longitude).toBeGreaterThan(camera.longitude);
  });

  it("is what the Mapsite map uses for the main pin and the opening fit", () => {
    const app = readFileSync("components/talispros/mapsite/MapSiteApplication.tsx", "utf8");
    expect(app).toContain("presentMapSitePins");
    expect(app).toContain("mapsitePinFitPaddingForViewport");
    expect(app).toContain("shiftCameraForNeighbors");
    expect(app).toContain("screenNudgeX");
  });
});
