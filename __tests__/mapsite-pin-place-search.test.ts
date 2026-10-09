import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import { shortPlaceLabel } from "@/components/talispros/mapsite/MapSitePlaceSearch";

const mocks = vi.hoisted(() => ({
  authorized: { value: true },
  readMapSiteForPinPurchase: vi.fn(),
  deleteAdditionalPinRecord: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/mapsite-edit-auth", () => ({
  requireMapSiteEditAccess: vi.fn(async () => {
    if (!mocks.authorized.value) throw new Error("denied");
  }),
}));
vi.mock("@/lib/stripe", () => ({
  getStripeSecretKey: () => null,
  getStripeClient: () => ({}),
}));
vi.mock("@/lib/talispros/mapsite-additional-pins-service", () => ({
  deleteAdditionalPinRecord: mocks.deleteAdditionalPinRecord,
  fixAdditionalPinRecord: vi.fn(),
  fulfillAdditionalPinsFromStripeCheckoutSession: vi.fn(),
  loadMapSitePinDashboard: vi.fn(),
  mapsiteCannotSellAdditionalPins: () => null,
  placeAdditionalPinRecord: vi.fn(),
  readMapSiteForPinPurchase: mocks.readMapSiteForPinPurchase,
  recordPendingPinPurchase: vi.fn(),
  redeemFreePinCredits: vi.fn(),
}));

import { deleteMapSiteAdditionalPin } from "@/app/talispros/mapsite/pin-actions";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("PIN Dashboard place-and-fix flow", () => {
  it("leads with Places search and tucks coordinates behind an Advanced toggle", () => {
    const panel = read("components/talispros/mapsite/MapSitePinDashboard.tsx");
    expect(panel).toContain("<MapSitePlaceSearch");
    expect(panel).toMatch(/<details[\s\S]*d\.advancedCoords[\s\S]*d\.placeAtCoords[\s\S]*<\/details>/);
    expect(panel).not.toContain("cancelPlacement");
    expect(panel).toContain("deleteMapSiteAdditionalPin");
    expect(panel).toContain("d.undo");
  });

  it("keeps placement ready: map clicks place while PINs remain, extra PINs are draggable", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain('pinEditor.kind === "place" && pinDashboard.remainingToPlace > 0');
    expect(app).toContain("pinDashboard.pins.map((pin) => pin.id)");
  });

  it("uses Places API (New) and hides itself without a key", () => {
    const search = read("components/talispros/mapsite/MapSitePlaceSearch.tsx");
    expect(search).toContain("AutocompleteSuggestion.fetchAutocompleteSuggestions");
    expect(search).toContain("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
    expect(search).toContain("if (!available) return null;");
  });

  it("labels a picked place by name, else the first address line", () => {
    expect(shortPlaceLabel("Ralphs", "645 W 9th St, Los Angeles, CA")).toBe("Ralphs");
    expect(shortPlaceLabel("", "645 W 9th St, Los Angeles, CA")).toBe("645 W 9th St");
    expect(shortPlaceLabel(null, null)).toBe("");
  });

  it("has matching EN and DE strings with a one-line explainer", () => {
    const enKeys = Object.keys(en.mapsite.pinDashboard).sort();
    const deKeys = Object.keys(de.mapsite.pinDashboard).sort();
    expect(deKeys).toEqual(enKeys);
    for (const key of ["searchPlaceholder", "advancedCoords", "stopPlacing", "undo", "delete", "edit"]) {
      expect(enKeys).toContain(key);
    }
    expect(en.mapsite.pinDashboard.placeHelp.length).toBeLessThan(90);
  });
});

describe("deleteMapSiteAdditionalPin", () => {
  beforeEach(() => {
    mocks.authorized.value = true;
    mocks.readMapSiteForPinPurchase.mockResolvedValue({ id: "m1", fastCode: "RM22" });
    mocks.deleteAdditionalPinRecord.mockReset();
  });

  it("only lets the owner delete", async () => {
    mocks.authorized.value = false;
    const result = await deleteMapSiteAdditionalPin({ mapsiteId: "m1", fastCode: "rm22", pinId: "p1" });
    expect(result.error).toMatch(/owner/);
    expect(mocks.deleteAdditionalPinRecord).not.toHaveBeenCalled();
  });

  it("rejects a FAST Code that does not match the Mapsite", async () => {
    const result = await deleteMapSiteAdditionalPin({ mapsiteId: "m1", fastCode: "zz99", pinId: "p1" });
    expect(result.error).toMatch(/FAST Code/);
    expect(mocks.deleteAdditionalPinRecord).not.toHaveBeenCalled();
  });

  it("deletes the PIN scoped to the Mapsite and returns the dashboard", async () => {
    const dashboard = { pins: [], remainingToPlace: 1 };
    mocks.deleteAdditionalPinRecord.mockResolvedValue({ dashboard });
    const result = await deleteMapSiteAdditionalPin({ mapsiteId: "m1", fastCode: "rm22", pinId: "p1" });
    expect(mocks.deleteAdditionalPinRecord).toHaveBeenCalledWith({ mapsiteId: "m1", pinId: "p1" });
    expect("dashboard" in result && result.dashboard).toBe(dashboard);
  });
});
