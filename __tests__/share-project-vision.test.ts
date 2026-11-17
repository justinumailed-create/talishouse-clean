import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

describe("Share a Project Vision (/talisu/discuss) redesign", () => {
  const ui = readFileSync(resolve("components/talisu/DiscussProjectClient.tsx"), "utf8");

  it("is a split layout like Aisha's /register: photo left, form right, stacked on phones", () => {
    expect(ui).toContain('className="grid w-full lg:grid-cols-2"');
    const photo = ui.indexOf('data-testid="talisu-discuss-photo"');
    const form = ui.indexOf("<form");
    expect(photo).toBeGreaterThan(0);
    expect(photo).toBeLessThan(form);
    expect(ui).toContain('DISCUSS_VISION_IMAGE = "/talisu/discuss-project-vision.webp"');
    expect(existsSync(resolve("public/talisu/discuss-project-vision.webp"))).toBe(true);
    expect(ui).toContain("alt={c.pageImageAlt}");
    expect(en.contactForm.pageImageAlt).not.toMatch(/talispros|tsplits/i);
    expect(de.contactForm.pageImageAlt.length).toBeGreaterThan(20);
    expect(ui).toContain("lg:sticky");
    expect(readFileSync(resolve("app/globals.css"), "utf8")).toContain(".talis-discuss-surface {");
  });

  it("keeps a large headline and a single primary button", () => {
    expect(ui).toContain("max-w-[560px]");
    expect(ui).toMatch(/text-\[52px\]/);
    expect(ui.match(/type="submit"/g)).toHaveLength(1);
    expect(ui).not.toContain("WorkingPageShell");
    // Arun (Nov 1): beige no longer required; warm ivory surface, Aisha's metal buttons.
    expect(ui).toContain("talis-discuss-surface");
    expect(ui).toContain("${METAL_TAB}");
    expect(ui).toContain("backgroundImage: ADVISER_METAL_BG");
    expect(ui).not.toContain("bg-[#0071e3]");
    expect(ui).not.toMatch(/console\.|TODO|lorem/i);
    expect(ui).not.toMatch(/placeholder=\{c\./);
  });

  it("keeps the saving path: same API, discuss-page channel, all required fields", () => {
    expect(ui).toContain('fetch("/api/ownership-contact"');
    expect(ui).toContain('channel: "discuss-page"');
    for (const f of ["name,", "email,", "phone,", "message,", "topic,", "locationVerified,"]) {
      expect(ui).toContain(f);
    }
    expect(ui).toContain("isValidNanpPhone");
    expect(ui).toContain("MapSitePlaceSearch");
    expect(ui).toContain('data-testid="discuss-topic"');
    expect(ui).toContain('data-testid="discuss-structures-open"');
    expect(ui).toContain('data-testid="discuss-webster"');
    expect(ui).toContain("/webster?call=1");
    expect(readFileSync(resolve("app/vision/page.tsx"), "utf8")).toContain('pageMetadata("/vision")');
  });

  it("has EN/DE copy in CAD with no dev text", () => {
    expect(en.contactForm.pageSubmit).toBe("Share Your Vision");
    expect(de.contactForm.pageSubmit).toBe("Vision teilen");
    expect(en.contactForm.pageLead).toBe(
      "Tell us where your project is and what you imagine. An advisor will contact you.",
    );
    expect(en.contactForm.pageLead).not.toMatch(/no registration|FAST Code/i);
    expect(de.contactForm.pageLead).not.toMatch(/ohne Registrierung|FAST Code/i);
    expect(en.contactForm.topic).toBe("Preferred Transaction Structure");
    expect(de.contactForm.topic).toBe("Bevorzugte Transaktionsstruktur");
    expect(en.contactForm.structuresAbout).toBe("About these structures");
    expect(de.contactForm.structuresAbout).toBe("Zu diesen Strukturen");
    expect(en.contactForm.structuresHint).toBe("Tap to compare structures");
    expect(de.contactForm.structuresHint).toBe("Tippen, um die Strukturen zu vergleichen");
    expect(`${en.contactForm.structuresAbout} ${en.contactForm.structuresHint}`).not.toMatch(/[—–]/);
    expect(`${de.contactForm.structuresAbout} ${de.contactForm.structuresHint}`).not.toMatch(/[—–]/);
    expect(ui).toContain("discuss-structures-pulse");
    expect(ui).toContain("c.structuresHint");
    expect(de.home.ownershipSections[3].body).toContain("Interesse, ganz oder anteilig,");
    expect(
      de.home.ownershipSections.map((section) => `${section.body} ${section.result}`).join("\n"),
    ).not.toMatch(/[—–]/);
    expect(en.contactForm.pageNote).toContain("CAD");
    expect(de.contactForm.pageNote).toContain("CAD");
    const all = JSON.stringify([en.contactForm, de.contactForm]);
    expect(all).not.toMatch(/TODO|TBD|USD|lorem/i);
  });

  it("Aisha's Propose Project button and Value-Added link point here", () => {
    const reg = readFileSync(resolve("app/register/page.tsx"), "utf8");
    expect(reg).toContain("propose: talisuHref(TALISU_DISCUSS_PATH)");
    const va = readFileSync(resolve("app/talisu/value-added/page.tsx"), "utf8");
    expect(va).toContain("talisuHref(TALISU_DISCUSS_PATH)");
  });
});
