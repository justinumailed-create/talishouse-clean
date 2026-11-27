import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import {
  MAPSITE_SHOW_ALL_BUFFER_KM,
  MAPSITE_SHOW_ALL_BUFFER_MILES,
  bufferedPinBounds,
  projectMapsitePinToScreen,
  viewportForMapsiteShowAll,
} from "@/lib/talispros/mapsite-initial-bounds";
import {
  PIN_STACK_TOLERANCE_METERS,
  applyPinStacks,
  decorateStackedPinHtml,
  findPinStacks,
  pinDistanceMeters,
  stackForPin,
} from "@/lib/talismaps/map-engine/pin-stacks";
import { buildPinMarkerHtml, pinStyleCacheKey } from "@/lib/talismaps/map-engine/pin-marker-icon";
import {
  flagAttachmentFolder,
  flagAttachmentPath,
  greyFlagActionFor,
  newestFlagAttachmentName,
  validateFlagAttachment,
} from "@/lib/talispros/mapsite-flag-attachments";

const repo = (path: string) => readFileSync(resolve(path), "utf8");
const bytes = (path: string) => readFileSync(resolve(path));

function pngSize(path: string): { width: number; height: number } {
  const buf = bytes(path);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function icoSizes(path: string): number[] {
  const buf = bytes(path);
  expect(buf.readUInt16LE(0)).toBe(0);
  expect(buf.readUInt16LE(2)).toBe(1);
  const count = buf.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => buf[6 + i * 16] || 256).sort((a, b) => a - b);
}

const noEmDash = (value: unknown) => expect(JSON.stringify(value)).not.toMatch(/[\u2014\u2013]/);

describe("Item #5: Show All replaces Switch PIN (+10 miles)", () => {
  it("uses a 10 mile (16.09 km) buffer", () => {
    expect(MAPSITE_SHOW_ALL_BUFFER_MILES).toBe(10);
    expect(MAPSITE_SHOW_ALL_BUFFER_KM).toBeCloseTo(16.09344, 4);
  });

  it("fits every PIN plus the buffer inside the map", () => {
    const pins = [
      { latitude: 43.65, longitude: -79.38 },
      { latitude: 43.8, longitude: -79.1 },
      { latitude: 43.55, longitude: -79.6 },
    ];
    const size = { mapWidth: 1200, mapHeight: 800 };
    const padding = { top: 56, right: 56, bottom: 56, left: 420 };
    const view = viewportForMapsiteShowAll({
      pins,
      fallbackCenter: pins[0]!,
      ...size,
      padding,
    });
    expect(view.mode).toBe("multi");
    for (const corner of bufferedPinBounds(pins, MAPSITE_SHOW_ALL_BUFFER_KM)) {
      const p = projectMapsitePinToScreen(corner, view.center, view.zoom, size.mapWidth, size.mapHeight);
      expect(p.x).toBeGreaterThanOrEqual(padding.left - 1);
      expect(p.x).toBeLessThanOrEqual(size.mapWidth - padding.right + 1);
      expect(p.y).toBeGreaterThanOrEqual(padding.top - 1);
      expect(p.y).toBeLessThanOrEqual(size.mapHeight - padding.bottom + 1);
    }
  });

  it("still frames a single PIN with the 10 mile box", () => {
    const view = viewportForMapsiteShowAll({
      pins: [{ latitude: 46.09, longitude: -64.78 }],
      fallbackCenter: { latitude: 46.09, longitude: -64.78 },
      mapWidth: 1000,
      mapHeight: 700,
    });
    expect(view.mode).toBe("single");
    expect(view.zoom).toBeLessThanOrEqual(11);
  });

  it("renders a Show All button (EN/DE) instead of the Switch PIN picker", () => {
    expect(en.mapsite.leftCard.showAll).toBe("Show All");
    expect(de.mapsite.leftCard.showAll).toBe("Alle anzeigen");
    const card = repo("components/talispros/mapsite/MapSiteMarketPartnerCard.tsx");
    expect(card).toContain('data-testid="mapsite-show-all-pins"');
    expect(card).not.toContain("mapsite-pin-switcher");
    expect(card).not.toContain("switchPin");
    const app = repo("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("viewportForMapsiteShowAll");
    expect(app).toContain("onShowAll={showAllPins}");
    // Show All closes the open PIN card first.
    expect(app).toMatch(/const showAllPins = useCallback\(\(\) => \{\s+setSelectedPinId\(null\);/);
  });
});

describe("Item #6: duplicate PINs get a white halo and a count", () => {
  const base = { latitude: 43.6532, longitude: -79.3832 };
  const pins = [
    { id: "main", ...base },
    { id: "dup", ...base },
    { id: "near", latitude: base.latitude + 0.00005, longitude: base.longitude },
    { id: "far", latitude: base.latitude + 0.01, longitude: base.longitude },
  ];

  it("groups identical and near-identical PINs", () => {
    expect(PIN_STACK_TOLERANCE_METERS).toBeGreaterThanOrEqual(10);
    expect(PIN_STACK_TOLERANCE_METERS).toBeLessThanOrEqual(15);
    expect(pinDistanceMeters(pins[0]!, pins[2]!)).toBeLessThan(PIN_STACK_TOLERANCE_METERS);
    const stacks = findPinStacks(pins);
    expect(stacks).toHaveLength(1);
    expect(stacks[0]!.leaderId).toBe("main");
    expect(stacks[0]!.pinIds).toEqual(["main", "dup", "near"]);
    expect(stackForPin(stacks, "near")?.leaderId).toBe("main");
    expect(stackForPin(stacks, "far")).toBeNull();
  });

  it("collapses a stack into one haloed leader, or keeps all while moving", () => {
    const collapsed = applyPinStacks(pins);
    expect(collapsed.pins.map((p) => p.id)).toEqual(["main", "far"]);
    expect(collapsed.pins[0]!.metadata?.stackCount).toBe(3);
    const expanded = applyPinStacks(pins, { collapse: false });
    expect(expanded.pins).toHaveLength(4);
  });

  it("draws the halo and count badge on the marker", () => {
    const leader = applyPinStacks(pins).pins[0]!;
    const html = buildPinMarkerHtml(leader, false).html;
    expect(html).toContain("box-shadow:0 0 0 3px #ffffff");
    expect(html).toContain('data-stack-count="3"');
    expect(pinStyleCacheKey(leader, false)).not.toBe(pinStyleCacheKey(pins[0]!, false));
    expect(decorateStackedPinHtml("<div>no body</div>", 3)).toBe("<div>no body</div>");
  });

  it("opens a picker listing every PIN in the stack", () => {
    const app = repo("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("MapSitePinStackPicker");
    expect(app).toContain("setOpenStack(stack)");
    noEmDash(en.mapsite.pinStack);
    noEmDash(de.mapsite.pinStack);
  });
});

describe("Item #7: owners unlink and drag misplaced PINs", () => {
  it("saves the main PIN through the existing coordinate columns", () => {
    const actions = repo("app/talispros/mapsite/pin-actions.ts");
    expect(actions).toContain("export async function moveMapSiteMainPin");
    const move = actions.slice(actions.indexOf("export async function moveMapSiteMainPin"));
    expect(move.slice(0, 800)).toContain("authorizePinEdit(fastCode)");
    const platform = repo("lib/talispros/mapsite-platform.ts");
    expect(platform).toContain("export async function moveMapSiteMainPinLocation");
    expect(platform).toMatch(/from\("build_requests"\)\s*\.update\(coords\)/);
  });

  it("only owners and editors can drag, with feedback", () => {
    const app = repo("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("const canMovePins = Boolean(canManageDashboard ?? isOwner)");
    expect(app).toContain("if (!code || !pinMoveMode || !canMovePins) return;");
    expect(app).toMatch(/pinMoveMode\s+\? movablePinIds/);
    expect(app).toContain("{canMovePins && pinEditor.kind === \"idle\" ? (");
    expect(en.mapsite.pinMove.saved).toBe("PIN location saved.");
    expect(de.mapsite.pinMove.start).toBeTruthy();
    noEmDash(en.mapsite.pinMove);
    noEmDash(de.mapsite.pinMove);
  });
});

describe("Item #8A: grey flag one-click actions", () => {
  it("gives owners an action on grey links only", () => {
    expect(greyFlagActionFor({ flag: "url", live: false, canManage: true })).toBe("url");
    expect(greyFlagActionFor({ flag: "tva", live: false, canManage: true })).toBe("tva");
    expect(greyFlagActionFor({ flag: "ttv", live: false, canManage: true })).toBe("ttv");
    expect(greyFlagActionFor({ flag: "url", live: true, canManage: true })).toBeNull();
    expect(greyFlagActionFor({ flag: "url", live: false, canManage: false })).toBeNull();
  });

  it("accepts a PDF for TEB and a PDF or text summary for TVA", () => {
    expect(validateFlagAttachment("teb", { name: "book.pdf", type: "application/pdf", size: 10 })).toEqual({ ok: true, extension: "pdf" });
    expect(validateFlagAttachment("teb", { name: "notes.txt", type: "text/plain", size: 10 }).ok).toBe(false);
    expect(validateFlagAttachment("tva", { name: "summary.txt", type: "text/plain", size: 10 }).ok).toBe(true);
    expect(validateFlagAttachment("tva", { name: "x.pdf", type: "application/pdf", size: 0 })).toEqual({ ok: false, reason: "empty" });
    expect(validateFlagAttachment("tva", { name: "x.pdf", type: "application/pdf", size: 30 * 1024 * 1024 })).toEqual({ ok: false, reason: "size" });
  });

  it("stores files per FAST Code without a database column", () => {
    expect(flagAttachmentFolder(" RM22 ")).toBe("flag-attachments/rm22");
    expect(flagAttachmentPath("RM22", "tva", "PDF", 5)).toBe("flag-attachments/rm22/tva-summary-5.pdf");
    expect(
      newestFlagAttachmentName(["tva-summary-1.pdf", "tva-summary-9.txt", "teb-pdf-20.pdf"], "tva"),
    ).toBe("tva-summary-9.txt");
    expect(newestFlagAttachmentName(["teb-pdf-20.pdf"], "tva")).toBeNull();
  });

  it("wires the popup without the eBook editor and keeps hover messages", () => {
    const popup = repo("components/talispros/mapsite/MapSitePropertyPopup.tsx");
    expect(popup).toContain("MapSiteGreyFlagAction");
    expect(popup).toContain("onGreyClick");
    expect(popup).toContain("<PinActionExplainer");
    expect(popup).not.toContain("MapSiteEbookEditorPanel");
    const action = repo("components/talispros/mapsite/MapSiteGreyFlagAction.tsx");
    expect(action).toContain("saveMapSiteListingLinksAction");
    expect(action).toContain("uploadMapSiteFlagAttachmentAction");
    expect(action).not.toContain("Ebook");
    const server = repo("app/talispros/mapsite/flag-actions.ts");
    expect(server).toContain("requireMapSiteEditAccess(fastCode)");
    noEmDash(en.mapsite.flagActions);
    noEmDash(de.mapsite.flagActions);
    expect(Object.keys(de.mapsite.flagActions).sort()).toEqual(Object.keys(en.mapsite.flagActions).sort());
  });

  it("puts PowerPoint, Keynote and Google Slides on the TEB bookshelf for owners", () => {
    const page = repo("app/talisbooks/fast/[fastCode]/page.tsx");
    expect(page).toContain("BookshelfTebDownloads");
    expect(page).toContain("canDownloadReplaceImageTemplates(code)");
    const downloads = repo("components/talisbooks/library/BookshelfTebDownloads.tsx");
    expect(downloads).toContain("<EbookPlatformLinks unlocked fastCode={fastCode} />");
    expect(repo("components/talisbooks/viewer/EbookPlatformLinks.tsx")).toContain("?fastCode=");
  });
});

describe("Item #8B: padded square tree-mark favicon", () => {
  it("ships real multi-size ICO files", () => {
    expect(icoSizes("public/favicon.ico")).toEqual([16, 32, 48]);
    expect(icoSizes("public/favicon-v2.ico")).toEqual([16, 32, 48]);
  });

  it("ships square PNG icons", () => {
    expect(pngSize("app/icon.png")).toEqual({ width: 512, height: 512 });
    expect(pngSize("app/apple-icon.png")).toEqual({ width: 180, height: 180 });
    expect(pngSize("public/favicon.png")).toEqual({ width: 180, height: 180 });
    expect(pngSize("public/favicon-v2.png")).toEqual({ width: 180, height: 180 });
  });

  it("keeps the root icon paths, cache-busted", () => {
    const layout = repo("app/layout.tsx");
    expect(layout).toContain('"/favicon-v2.ico?v=3"');
    expect(layout).toContain('"/favicon-v2.png?v=3"');
    expect(repo("scripts/generate-padded-favicons.py")).toContain("MARGIN = 0.11");
  });
});

describe("Item #9: registration code wording", () => {
  it("uses registration code in the Home Market hint (EN/DE)", () => {
    expect(en.homeMarket.registerHint).toBe(
      "Register using my registration code, Aishaa. It is already filled in for you.",
    );
    expect(de.homeMarket.registerHint).toContain("Registrierungscode");
    expect(JSON.stringify(en.homeMarket)).not.toMatch(/agent code/i);
    expect(JSON.stringify(de.homeMarket)).not.toMatch(/agent code|agentencode/i);
  });
});
