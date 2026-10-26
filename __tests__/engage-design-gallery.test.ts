import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { fmt } from "../lib/i18n/format";
import { loadCataloguePages } from "../lib/talisu/catalogue-pages";
import { CATALOGUE_PRODUCTS } from "../lib/talisu/catalogue-products";
import { loadEngageDesigns } from "../lib/talisu/engage-designs";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("/talisu/engage design gallery", () => {
  it("lists every catalogue design (P01–P108) from the visible pages only", () => {
    const designs = loadEngageDesigns();
    expect(designs).toHaveLength(108);
    expect(designs.map((d) => d.code)).toEqual(CATALOGUE_PRODUCTS.map((p) => p.code));
    expect(designs[0]).toMatchObject({ code: "P01", src: "/product-flipbook/page-20.webp", page: 20 });
    expect(designs.at(-1)).toMatchObject({ code: "P108", src: "/product-flipbook/page-37.webp", page: 37 });
    const visibleSrcs = new Set(loadCataloguePages().map((p) => p.src));
    for (const d of designs) {
      expect(visibleSrcs.has(d.src)).toBe(true);
      expect(d.page).toBeGreaterThanOrEqual(20);
      expect(d.rect.w).toBeGreaterThan(0);
    }
    // No real names in the catalogue yet: the generic label is shown instead.
    expect(designs.every((d) => d.name === null)).toBe(true);
  });

  it("replaces the flipbook on /talisu/engage; /catalogue keeps it", () => {
    const engage = read("app/talisu/engage/page.tsx");
    expect(engage).toContain("<EngageDesignGallery designs={designs} />");
    expect(engage).not.toContain("TopBoundFlipbook");
    expect(engage).toContain("engage-catalogue-hint");
    expect(read("app/catalogue/page.tsx")).toContain("TopBoundFlipbook");
  });

  it("has no zoom: each tile and its Reserve button go straight to step=pay&product=Pxx", () => {
    const g = read("components/talisu/EngageDesignGallery.tsx");
    expect(g).toContain("href={talisUEngageCheckoutHref(design.code)}");
    expect(g).toContain('data-testid="engage-design-reserve"');
    expect(g).toContain("fmt(e.galleryReserve, { code: design.code })");
    // Lightbox and its handlers are gone, not hidden.
    expect(g).not.toMatch(/lightbox|role="dialog"|aria-modal|onTouch|keydown|Escape|ArrowRight|ArrowLeft|useState|useEffect/);
    expect(g).not.toMatch(/galleryOpen|galleryClose|galleryPrev|galleryNext|galleryCount|galleryDialog/);
    // Client bundle must not pull in the fs-based page loader.
    expect(g).toContain('import type { EngageDesign } from "@/lib/talisu/engage-designs";');
    expect(g).not.toMatch(/^import \{[^}]*\} from "@\/lib\/talisu\/engage-designs"/m);
    expect(g).not.toContain("catalogue-pages");
    // Crops must escape the global `img { max-width: 100% }`.
    expect(g).toContain('maxWidth: "none"');
  });

  it("has final EN and DE gallery copy", () => {
    const e = en.talisu.engage;
    const d = de.talisu.engage;
    expect(e.catalogueHint).toBe("Choose a design and reserve it with your $2,000 CAD down payment.");
    expect(d.catalogueHint).toBe("Wählen Sie ein Design und reservieren Sie es mit Ihrer Anzahlung von 2.000 CAD.");
    expect(`${e.catalogueHint} ${d.catalogueHint}`).not.toMatch(/zoom|vergrößer|flip|unit/i);
    expect(fmt(e.galleryReserve, { code: "P07" })).toBe("Reserve P07");
    expect(fmt(d.galleryReserve, { code: "P07" })).toBe("P07 reservieren");
    expect(e.galleryDefaultName).toBe("Talishouse™ design suggestion");
    expect(d.galleryDefaultName).toBe("Talishouse™-Designvorschlag");
    for (const key of ["galleryOpen", "galleryDialog", "galleryClose", "galleryPrev", "galleryNext", "galleryCount", "galleryReserveNote"]) {
      expect(key in e).toBe(false);
      expect(key in d).toBe(false);
    }
  });
});
