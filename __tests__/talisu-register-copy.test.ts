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

  it("keeps account registration and adds the SamCart purchase checkout", () => {
    expect(TALISU_REGISTER.samcartUrl).toBe(
      "https://talispros.mysamcart.com/checkout/register",
    );
    expect(TALISU_REGISTER.purchaseUrl).toBe(
      "https://talispros.mysamcart.com/checkout/purchase",
    );
    expect(TALISU_REGISTER.catalogue.href).toBe("/catalogue");
  });
});

describe("Register page catalogue section", () => {
  const page = readFileSync(resolve("app/talisu/reg/page.tsx"), "utf8");
  const welcome = readFileSync(resolve("app/talisu/page.tsx"), "utf8");
  const config = readFileSync(resolve("next.config.ts"), "utf8");

  it("embeds the purchase checkout beside the catalogue and does not render Sea-Cans", () => {
    expect(page).toContain('id="catalogue"');
    expect(page).toContain("TALISU_REGISTER.purchaseUrl");
    expect(page).toContain("loadProductFlipbookPages");
    expect(page).not.toMatch(/Sea-Can/i);
    expect(welcome).not.toMatch(/Sea-Can/i);
    expect(welcome).toContain('href="/talisu/reg#catalogue"');
  });

  it("redirects Sea-Can routes to the Register catalogue section", () => {
    for (const source of [
      '"/talisu/bo"',
      '"/talisu/bo/:path*"',
      '"/talisu/sh"',
      '"/talisu/cu"',
      '"/talisu/blog"',
    ]) {
      expect(config).toContain(`source: ${source}`);
    }
    expect(config).toContain('destination: "/talisu/reg#catalogue"');
  });
});
