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
    expect(engage).toContain("<EngageSelection");
    expect(read("components/talisu/EngageSelection.tsx")).toContain(
      "<EngageDesignGallery designs={designs} selected={selected} onToggle={toggle} />",
    );
    expect(engage).not.toContain("TopBoundFlipbook");
    expect(read("components/talisu/EngageSelection.tsx")).toContain("engage-catalogue-hint");
    expect(read("app/catalogue/page.tsx")).toContain("TopBoundFlipbook");
  });

  it("has no zoom; each tile is a Select / Selected toggle and never links to step=pay", () => {
    const g = read("components/talisu/EngageDesignGallery.tsx");
    // Engage lock: tiles select designs; only the one CTA goes to the down payment.
    expect(g).not.toContain("talisUEngageCheckoutHref");
    expect(g).not.toMatch(/href=|<Link|next\/link/);
    expect(g).toContain("onClick={() => onToggle(design.code)}");
    expect(g).toContain("aria-pressed={isSelected}");
    expect(g).toContain('data-testid="engage-design-select"');
    expect(g).toContain('data-testid="engage-design-check"');
    expect(g).toContain("e.gallerySelected");
    expect(g).toContain("e.gallerySelect");
    expect(g).not.toContain("galleryReserve");
    // No lightbox / dialog: the hooks only drive the scroll arrows.
    expect(g).not.toMatch(/lightbox|role="dialog"|aria-modal|onTouch|keydown|Escape|ArrowRight|ArrowLeft/);
    expect(g).not.toMatch(/galleryOpen|galleryClose|galleryPrev|galleryNext|galleryCount|galleryDialog/);
    // Client bundle must not pull in the fs-based page loader.
    expect(g).toContain('import type { EngageDesign } from "@/lib/talisu/engage-designs";');
    expect(g).not.toMatch(/^import \{[^}]*\} from "@\/lib\/talisu\/engage-designs"/m);
    expect(g).not.toContain("catalogue-pages");
    // Crops must escape the global `img { max-width: 100% }`.
    expect(g).toContain('maxWidth: "none"');
  });

  it("shows the designs in ONE horizontal row that scrolls right (Ralf, Oct 26)", () => {
    const g = read("components/talisu/EngageDesignGallery.tsx");
    // Single row: flex + horizontal overflow, no multi-row grid / vertical scroll box.
    expect(g).toContain("flex snap-x snap-mandatory");
    expect(g).toContain("overflow-x-auto overflow-y-hidden");
    expect(g).toContain("scroll-smooth");
    expect(g).not.toMatch(/grid-cols-|max-h-\[|overflow-y-auto/);
    // Fixed-width snapping tiles so a partial next tile peeks in.
    expect(g).toContain("w-[8.5rem] shrink-0 snap-start sm:w-[9.75rem]");
    // Arrows on desktop only (md:flex), swipe on touch; smooth paging.
    expect(g).toContain('data-testid="engage-gallery-prev"');
    expect(g).toContain('data-testid="engage-gallery-next"');
    expect(g).toContain("md:flex");
    expect(g).toContain('behavior: reduceMotion ? "auto" : "smooth"');
    expect(g).toContain("aria-label={e.galleryScrollBack}");
    expect(g).toContain("aria-label={e.galleryScrollMore}");
    // The column is min-w-0 so the row never widens the page.
    expect(read("components/talisu/EngageSelection.tsx")).toContain('className="mt-4 min-w-0"');
    expect(en.talisu.engage.galleryScrollMore).toBe("Scroll designs right");
    expect(de.talisu.engage.galleryScrollMore).toBe("Designs nach rechts scrollen");
    expect(de.talisu.engage.galleryScrollBack).toBe("Designs nach links scrollen");
  });

  it("has final EN and DE gallery copy", () => {
    const e = en.talisu.engage;
    const d = de.talisu.engage;
    expect(e.catalogueHint).toBe("Select one or more designs, then reserve them with your $2,000 CAD down payment.");
    expect(d.catalogueHint).toBe(
      "Wählen Sie ein oder mehrere Designs aus und reservieren Sie sie mit Ihrer Anzahlung von 2.000 CAD.",
    );
    expect(`${e.catalogueHint} ${d.catalogueHint}`).not.toMatch(/zoom|vergrößer|flip|unit/i);
    expect(e.gallerySelect).toBe("Select");
    expect(e.gallerySelected).toBe("Selected");
    expect(d.gallerySelect).toBe("Auswählen");
    expect(d.gallerySelected).toBe("Ausgewählt");
    expect(fmt(e.selectedSummary, { codes: "P03, P07" })).toBe("Selected: P03, P07");
    expect(fmt(d.selectedSummary, { codes: "P03, P07" })).toBe("Ausgewählt: P03, P07");
    // Oct 26: the design is Thorsten's only lock condition.
    expect("lockNeedStructure" in e).toBe(false);
    expect("lockNeedStructure" in d).toBe(false);
    expect("structureSummary" in e).toBe(false);
    expect("structureSummary" in d).toBe(false);
    expect(e.lockNeedDesign).toBe("Select at least one design");
    expect(d.lockNeedDesign).toBe("Wählen Sie mindestens ein Design aus");
    expect(e.galleryDefaultName).toBe("Talishouse™ design suggestion");
    expect(d.galleryDefaultName).toBe("Talishouse™-Designvorschlag");
    for (const key of ["galleryOpen", "galleryDialog", "galleryClose", "galleryPrev", "galleryNext", "galleryCount", "galleryReserveNote", "galleryReserve"]) {
      expect(key in e).toBe(false);
      expect(key in d).toBe(false);
    }
  });
});
