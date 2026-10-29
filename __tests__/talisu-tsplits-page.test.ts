import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER,
} from "@/lib/talisu/markets-pins";
import {
  TSPLITS_BOOK_COPY,
  TSPLITS_PATH,
  createTsplitsViewerBook,
} from "@/lib/talisu/tsplits-book";

const pageSrc = () => readFileSync(resolve("app/talisu/tsplits/page.tsx"), "utf8");
const shellSrc = () =>
  readFileSync(resolve("components/talisbooks/viewer/TalisBooksViewerShell.tsx"), "utf8");
const flat = (v: unknown): string => JSON.stringify(v);
const publicFile = (url: string) => resolve("public", url.replace(/^\//, ""));

describe("TSPLITS™ page (/talisu/tsplits)", () => {
  it("is item one in the TalisU dropdown, above Bookshelf / FAQ / Media Directory and the divider", () => {
    const labels = TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label as string);
    expect(labels[0]).toBe("TSPLITS™");
    expect(TALISU_MKTS_HEADER_DROPDOWN[0]?.href).toBe("/talisu/tsplits");
    expect(TSPLITS_PATH).toBe("/talisu/tsplits");
    expect(labels.indexOf("TSPLITS™")).toBeLessThan(labels.indexOf(TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER));
    expect(labels.slice(1)).toEqual(["Bookshelf", "FAQ", "Media Directory", "Contract", "Knowledge Base"]);
    const header = readFileSync(resolve("components/talisu/TalisUMktsHeader.tsx"), "utf8");
    expect(header).toContain('case "TSPLITS™":');
    expect(header).toContain("t.nav.talisuMenu.tsplits");
    expect(getDictionary("en").nav.talisuMenu.tsplits).toBe("TSPLITS™");
    expect(getDictionary("de").nav.talisuMenu.tsplits).toBe("TSPLITS™");
  });

  it("is a registered page with EN/DE eBook SEO metadata and OG cards", () => {
    expect(pageSrc()).toContain('pageMetadata("/talisu/tsplits")');
    const seo = JSON.parse(readFileSync(resolve("lib/seo/pages.json"), "utf8")) as {
      pages: Record<string, { en: { title: string }; de: { title: string } }>;
    };
    const page = seo.pages["/talisu/tsplits"];
    const entry = flat(page);
    expect(page.en.title).toContain("TSPLITS™ eBook");
    expect(page.de.title).toContain("TSPLITS™ eBook");
    expect(entry).toContain("\"image\":\"/og/pages/talisu-tsplits\"");
    expect(entry).not.toMatch(/USD|US\$/);
    expect(existsSync(resolve("public/og/pages/talisu-tsplits-en.jpg"))).toBe(true);
    expect(existsSync(resolve("public/og/pages/talisu-tsplits-de.jpg"))).toBe(true);
  });

  it("is a 10-page Talisbook™: front cover first, four spreads, back cover last (EN + DE)", () => {
    for (const locale of ["en", "de"] as const) {
      const book = createTsplitsViewerBook(locale);
      expect(book.pages).toHaveLength(10);
      expect(book.pages.map((p) => p.pageNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(book.pages[0]?.layout).toBe("cover");
      expect(book.pages[0]?.heroImageUrl).toBe(`/talisbooks/tsplits/${locale}/front.jpg`);
      expect(book.pages[9]?.layout).toBe("cover");
      expect(book.pages[9]?.heroImageUrl).toBe(`/talisbooks/tsplits/${locale}/back.jpg`);
      expect(book.coverSpreadOpening).toBe(false);
      for (const p of book.pages.slice(1, 9)) {
        expect(p.layout).toMatch(/^centerfold_(left|right)$/);
        expect(p.spreadImageUrl).toMatch(new RegExp(`^/talisbooks/tsplits/${locale}/spread-0[1-4]\\.jpg$`));
      }
      const images = new Set(book.pages.map((p) => p.spreadImageUrl ?? p.heroImageUrl));
      expect(images.size).toBe(6);
      for (const url of images) expect(existsSync(publicFile(url as string))).toBe(true);
      expect(book.pdfDownloadUrl).toBeUndefined();
      expect(flat(book)).not.toMatch(/USD|US\$/);
    }
    expect(createTsplitsViewerBook("fr").pages[0]?.heroImageUrl).toContain("/en/");
  });

  it("ships EN/DE PDFs and a small Download PDF link under the book", () => {
    expect(TSPLITS_BOOK_COPY.en.downloadPdf).toBe("Download PDF");
    expect(TSPLITS_BOOK_COPY.de.downloadPdf).toBe("PDF herunterladen");
    for (const locale of ["en", "de"] as const) {
      const pdf = publicFile(TSPLITS_BOOK_COPY[locale].pdfUrl);
      expect(existsSync(pdf)).toBe(true);
      expect(statSync(pdf).size).toBeGreaterThan(500_000);
      expect(readFileSync(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    }
    const src = pageSrc();
    expect(src).toContain('data-testid="tsplits-download-pdf"');
    expect(src.indexOf("<TalisBooksViewerShell")).toBeLessThan(src.indexOf("tsplits-download-pdf"));
  });

  it("uses the existing viewer inside the 1400 px working frame, without Claim / Assign", () => {
    const src = pageSrc();
    expect(src).toContain("talis-working-bg");
    expect(src).toContain("max-w-[1400px]");
    expect(src).toMatch(/<TalisBooksViewerShell[^>]*\bhideClaim\b[^>]*\bkeyboardNav\b[^>]*\bsingleOnMobile\b/);
    expect(src.replace(/\bhideClaim\b/g, "")).not.toMatch(/Claim|Assign/);
    const shell = shellSrc();
    expect(shell).toContain('event.key === "ArrowRight"');
    expect(shell).toContain('event.key === "ArrowLeft"');
    expect(shell).toContain("const showClaim = !fromBookshelf && !hideClaim;");
    expect(shell).toContain('matchMedia("(max-width: 640px)")');
  });
});
