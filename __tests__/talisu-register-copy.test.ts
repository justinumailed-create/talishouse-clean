import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TALISU_REGISTER } from "../lib/talisu/content";

describe("TalisU Register copy", () => {
  const bullets = TALISU_REGISTER.bullets;

  it("spells out TEB, TVA, and TTV instead of the short codes alone", () => {
    expect(bullets.map((b) => b.label)).toEqual([
      "Mapsites™",
      "Talisbooks™ (TEB)",
      "Listing analysis (TVA)",
      "TalisTV™ (TTV)",
    ]);
  });

  it("says we provide and manage for TEB and TTV", () => {
    const teb = bullets.find((b) => b.label.includes("(TEB)"));
    const ttv = bullets.find((b) => b.label.includes("(TTV)"));
    const tva = bullets.find((b) => b.label.includes("(TVA)"));
    expect(teb?.text.startsWith("we provide and manage")).toBe(true);
    expect(ttv?.text).toContain("we provide and manage");
    expect(tva?.text.startsWith("we analyze")).toBe(true);
  });

  it("keeps account registration SamCart checkout", () => {
    expect(TALISU_REGISTER.samcartUrl).toBe(
      "https://talispros.mysamcart.com/checkout/register",
    );
    expect(TALISU_REGISTER).not.toHaveProperty("purchaseUrl");
    expect(TALISU_REGISTER).not.toHaveProperty("catalogue");
  });
});

describe("Register page without catalogue purchase section", () => {
  const page = readFileSync(resolve("app/talisu/reg/page.tsx"), "utf8");
  const welcome = readFileSync(resolve("app/talisu/page.tsx"), "utf8");
  const config = readFileSync(resolve("next.config.ts"), "utf8");

  it("keeps partner + register checkout and does not render Catalogue/Purchase or Sea-Cans", () => {
    expect(page).not.toContain('id="catalogue"');
    expect(page).not.toContain("purchaseUrl");
    expect(page).not.toContain("TalisU Purchase — SamCart");
    expect(page).not.toContain("loadProductFlipbookPages");
    expect(page).not.toContain("Open the catalogue");
    expect(page).toContain("SamCartEmbed");
    expect(page).toContain("TalisU Register — SamCart");
    expect(page).toContain("TALISU_REGISTER.samcartUrl");
    expect(page).not.toContain("opens in a new tab");
    expect(page).not.toMatch(/Sea-Can/i);
    expect(welcome).not.toMatch(/Sea-Can/i);
    expect(welcome).not.toContain('href="/talisu/bo"');
    expect(welcome).not.toContain('href="/talisu/au"');
    expect(welcome).toContain('id="faq"');
    expect(welcome).toContain("TALISU_FAQ");
    expect(page).toContain("max-w-[1920px]");
    expect(page).toContain("minmax(16rem,20rem)_minmax(0,1fr)");
  });

  it("redirects Sea-Can routes to Register without catalogue hash", () => {
    for (const source of [
      '"/talisu/bo"',
      '"/talisu/bo/:path*"',
      '"/talisu/sh"',
      '"/talisu/cu"',
      '"/talisu/blog"',
    ]) {
      expect(config).toContain(`source: ${source}`);
    }
    expect(config).toContain('destination: "/talisu/reg"');
    expect(config).not.toContain('destination: "/talisu/reg#catalogue"');
  });
});
