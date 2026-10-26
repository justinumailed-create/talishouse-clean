import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { fmt } from "../lib/i18n/format";
import {
  CATALOGUE_CLOSING_PHOTO_SRC,
  CATALOGUE_HIDDEN_CONTENT_PAGES,
  loadCataloguePages,
} from "../lib/talisu/catalogue-pages";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Catalogue closing page (Thorsten P + page buttons)", () => {
  it("closes on Thorsten P's photo instead of the Aisha raster", () => {
    const back = loadCataloguePages().at(-1);
    expect(CATALOGUE_CLOSING_PHOTO_SRC).toBe("/talisu/webster-team-leader-v2.jpg");
    expect(back).toMatchObject({ role: "back", face: "webster", src: CATALOGUE_CLOSING_PHOTO_SRC });
    expect(back?.src).not.toContain("page-38");
    expect(en.catalogueUi.closingPartnerName).toBe("Thorsten P");
    expect(de.catalogueUi.closingPartnerName).toBe("Thorsten P");
    const page = read("components/product-flipbook/WebsterCataloguePage.tsx");
    expect(page).toContain("engage.partnerImage");
    expect(page).toContain("c.closingPartnerName");
    expect(page).not.toMatch(/aisha/i);
  });

  it("offers one button per visible content page, never a hidden page", () => {
    const pages = loadCataloguePages();
    const targets = pages
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => page.role === "content")
      .map(({ page }) => page.number);
    const visible = [1, 2, 3, ...Array.from({ length: 18 }, (_, i) => 20 + i)];
    expect(targets).toEqual(visible);
    // Hidden source pages (2–19) never get a button; 2–3 are the T-Dome / G-House sheets
    const hiddenRaster = pages.filter(
      (p) =>
        p.role === "content" &&
        p.face !== "spec" &&
        p.sourcePage >= CATALOGUE_HIDDEN_CONTENT_PAGES.from &&
        p.sourcePage <= CATALOGUE_HIDDEN_CONTENT_PAGES.to,
    );
    expect(hiddenRaster).toEqual([]);
    expect(targets.filter((n) => n >= 4 && n <= 19)).toEqual([]);
    const flipbook = read("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(flipbook).toContain('page.role === "content" ? [{ number: page.number, index: leafIndex }]');
    expect(flipbook).toContain("onJump: jumpTo");
    expect(flipbook).toMatch(/const jumpTo = useCallback\([\s\S]*?setIndex\(toIndex\)/);
  });

  it("labels the buttons Page N / Seite N with the shared metal-tab style", () => {
    expect(fmt(en.catalogueUi.pageButton, { page: 1 })).toBe("Page 1");
    expect(fmt(en.catalogueUi.pageButton, { page: 20 })).toBe("Page 20");
    expect(fmt(de.catalogueUi.pageButton, { page: 1 })).toBe("Seite 1");
    expect(fmt(de.catalogueUi.pageButton, { page: 37 })).toBe("Seite 37");
    const page = read("components/product-flipbook/WebsterCataloguePage.tsx");
    expect(page).toContain('from "@/components/talisu/metal-tab"');
    expect(page).toContain("METAL_TAB_UNSELECTED");
    expect(page).toContain("backgroundImage: ADVISER_METAL_BG");
    expect(page).toContain("fmt(c.pageButton, { page: target.number })");
    // Buttons must not also turn the page
    expect(page).toContain("onPointerDown={stopFlip}");
  });

  it("sends the CTA to Thorsten P's $2,000 CAD down payment", () => {
    const flipbook = read("components/product-flipbook/TopBoundFlipbook.tsx");
    expect(flipbook).toContain("ctaHref: embedded ? talisUEngageCheckoutHref() : ROUTES.TALISU_ENGAGE");
    const page = read("components/product-flipbook/WebsterCataloguePage.tsx");
    expect(page).toContain("t.talisu.engageWebster");
    expect(page).toContain("href={ctaHref}");
  });
});
