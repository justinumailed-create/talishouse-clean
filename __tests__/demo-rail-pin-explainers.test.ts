import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { TALISU_FAQ } from "../lib/talisu/content";
import {
  ebookLogoFromBookMetadata,
  pickSlotLogoUrl,
  slotBrokerageName,
  slotInitials,
} from "../lib/talispros/fast-code-slots";

const read = (p: string) => readFileSync(resolve(p), "utf8");

const FAQ_TEB =
  TALISU_FAQ.items
    .flatMap((item) => item.bullets ?? [])
    .find((bullet) => bullet.startsWith("TEB™:")) ?? "";

describe("Demo Mapsite rail (FAST Codes)", () => {
  it("scrolls the list on its own and keeps the password box above it", () => {
    const panel = read("components/talispros/demo-mapsite/FastCodeSlotsPanel.tsx");
    const scroll = panel.indexOf('data-testid="fast-code-slots-scroll"');
    const gate = panel.indexOf('data-testid="fast-code-gate"');
    expect(scroll).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(scroll);
    expect(panel).toContain("fast-code-slot-logo");
    expect(panel).toContain("fast-code-slot-initials");
    expect(panel).toContain("openProspectMapsiteAction");
    const css = read("app/globals.css");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("minmax(26rem, 1.15fr)");
  });

  it("picks a real logo and otherwise initials, never the platform fallback", () => {
    expect(
      pickSlotLogoUrl([
        null,
        "/images/mapsites/header-fallback-logo.jpeg",
        "  https://cdn.example/logo.png  ",
      ]),
    ).toBe("https://cdn.example/logo.png");
    expect(pickSlotLogoUrl(["/logo.png", "not a url", ""])).toBeNull();
    const powermycode =
      "https://cdn.example/mapsite-assets/7c8a3aa1/logo-1783763252674.png";
    expect(pickSlotLogoUrl([powermycode, "https://cdn.example/realty.svg"])).toBe(
      "https://cdn.example/realty.svg",
    );
    expect(pickSlotLogoUrl(["https://cdn.example/powermycode/mark.png"])).toBeNull();
    expect(slotBrokerageName("Macdonald Realty Squamish", "Squamish")).toBe(
      "Macdonald Realty Squamish",
    );
    expect(slotBrokerageName("Rahul's PIN", "Squamish")).toBe("Squamish");
    expect(slotBrokerageName("Demo Mapsite", "Nelson")).toBe("Nelson");
    expect(
      ebookLogoFromBookMetadata({
        rm22SlotHydration: { agencyLogoUrl: " /uploads/agency.webp " },
      }),
    ).toBe("/uploads/agency.webp");
    expect(ebookLogoFromBookMetadata({ logoUrl: "https://cdn.example/book.png" })).toBe(
      "https://cdn.example/book.png",
    );
    expect(ebookLogoFromBookMetadata(null)).toBeNull();
    expect(slotInitials("East Coast Realty", "kk01")).toBe("EC");
    expect(slotInitials("The Right Choice Realty", "dw01")).toBe("RC");
    expect(slotInitials("DFH Real Estate Sidney", "mkj01")).toBe("DFH");
    expect(slotInitials("LD Agence Immobilière", "kd01")).toBe("LD");
    expect(slotInitials("", "ys01")).toBe("YS");
  });
});

describe("PIN action explainers", () => {
  it("uses the TalisU FAQ TEB™ sentence and a tokenization learn-more link", () => {
    expect(FAQ_TEB.startsWith("TEB™:")).toBe(true);
    expect(en.mapsite.pinActions.teb).toBe(FAQ_TEB);
    expect(en.mapsite.pinActions.teb).toContain("Talis EBooks™");
    expect(en.mapsite.pinActions.teb).toContain("help you stand out");
    expect(de.mapsite.pinActions.teb.startsWith("TEB™:")).toBe(true);
    expect(de.mapsite.pinActions.teb).toContain("Talis EBooks™");
    expect(de.talisu.faq.items.flatMap((item) => item.bullets ?? []).find((b) => b.startsWith("TEB™:"))).toBe(
      de.mapsite.pinActions.teb,
    );
    expect(en.mapsite.pinActions.learnMoreHref).toBe("/talisu?essay=tokenization");
    expect(de.mapsite.pinActions.learnMoreHref).toBe(en.mapsite.pinActions.learnMoreHref);
    expect(en.mapsite.pinActions.ttv).toBe(
      "TTV™: TalisTV™ sets up promotions for your In-House Online TV Station that allows for scheduled advertising producing measurable results.",
    );
    expect(de.mapsite.pinActions.ttv).toContain("TalisTV™");
    expect(de.mapsite.pinActions.ttv).toContain("messbaren Ergebnissen");
    expect(en.mapsite.pinActions.ttv).not.toMatch(/month|TBD|TODO|token value/i);
    expect(de.mapsite.pinActions.ttv).not.toMatch(/Monat|TBD|TODO/i);
    expect(en.mapsite.pinActions.url).not.toMatch(/Mapsite™|TODO|TBD/);
    expect(de.mapsite.pinActions.url).not.toBe(en.mapsite.pinActions.url);
  });

  it("is on the demo PIN card and on Mapsite PIN cards", () => {
    const demo = read("components/talispros/demo-mapsite/DemoHeroMap.tsx");
    const popup = read("components/talispros/mapsite/MapSitePropertyPopup.tsx");
    expect(demo).toContain("PinActionExplainer");
    expect(popup).toContain("PinActionExplainer");
    const explainer = read("components/talispros/mapsite/PinActionExplainer.tsx");
    expect(explainer).toContain("createPortal");
    expect(explainer).toContain('zIndex: 80');
    expect(explainer).toContain("pin-action-ttv-learn-more");
    expect(explainer).toContain("coarsePointer");
  });
});
