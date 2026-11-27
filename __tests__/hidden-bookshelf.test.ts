import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  HIDDEN_BOOKS,
  HIDDEN_BOOKSHELF_PATH,
  HIDDEN_BOOKSHELF_ROBOTS,
  createHiddenViewerBook,
  getHiddenBook,
  hiddenBookHref,
  hiddenBookPageCount,
  hiddenBookshelfMetadata,
  isHiddenBookshelfPath,
  type HiddenBookBlock,
} from "../lib/talisbooks/hidden-bookshelf";
import { buildAdminMetadata } from "../lib/seo/page-seo";
import { indexablePageRoutes } from "../lib/seo/indexable-routes";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const SHELF_PAGE = "app/private-shelf/page.tsx";
const BOOK_PAGE = "app/private-shelf/[slug]/page.tsx";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|json|py|xml|txt)$/.test(name)) out.push(full);
  }
  return out;
}

function jpegSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1]!;
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error(`no SOF in ${file}`);
}

function blockText(block: HiddenBookBlock): string[] {
  switch (block.type) {
    case "list":
      return [...block.items];
    case "hurdle":
      return [block.hurdle, block.cleared];
    case "image":
      return [block.alt, block.caption];
    case "illus":
      return [block.alt];
    case "toc":
      return block.items.map((item) => item.label);
    case "oops":
      return [block.title, block.text];
    case "table":
      return block.rows.flatMap((row) => [row.when, row.hurdle, row.cleared]);
    case "signoff":
      return [block.name, block.role];
    default:
      return [block.text];
  }
}

const journey = getHiddenBook("tsplits-journey")!;
const lines = [
  journey.title,
  journey.subtitle,
  journey.description,
  ...journey.pages.flatMap((page) => [
    page.kicker,
    page.title,
    ...page.blocks.flatMap(blockText),
  ]),
];

describe("hidden bookshelf routes are unlisted", () => {
  it("uses /private-shelf and /private-shelf/tsplits-journey", () => {
    expect(HIDDEN_BOOKSHELF_PATH).toBe("/private-shelf");
    expect(hiddenBookHref("tsplits-journey")).toBe("/private-shelf/tsplits-journey");
    expect(isHiddenBookshelfPath("/private-shelf")).toBe(true);
    expect(isHiddenBookshelfPath("/private-shelf/tsplits-journey")).toBe(true);
    expect(isHiddenBookshelfPath("/talisbooks")).toBe(false);
  });

  it("robots are noindex, nofollow and nocache on both routes", () => {
    expect(HIDDEN_BOOKSHELF_ROBOTS).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    });
    for (const file of [SHELF_PAGE, BOOK_PAGE]) {
      const src = read(file);
      expect(src).toMatch(/export async function generateMetadata/);
      expect(src).toContain("hiddenBookshelfMetadata(");
    }
    const meta = hiddenBookshelfMetadata(buildAdminMetadata("en"), {
      title: "Tsplits™ Journey | Tsplits™",
      description: journey.description,
      path: hiddenBookHref(journey.slug),
      image: journey.frontCover,
    });
    expect(meta.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    });
    expect(meta.title).toBe("Tsplits™ Journey | Tsplits™");
  });

  it("is not linked from any nav bar, footer, dropdown or sitemap source", () => {
    const allowed = new Set(
      [
        "lib/talisbooks/hidden-bookshelf-paths.ts",
        "lib/talisbooks/hidden-bookshelf.ts",
        "__tests__/hidden-bookshelf.test.ts",
      ].map((rel) => path.join(ROOT, rel)),
    );
    const files = ["app", "components", "lib", "scripts", "public"]
      .filter((dir) => existsSync(path.join(ROOT, dir)))
      .flatMap((dir) => walk(path.join(ROOT, dir)));
    // The hidden route files themselves may name their own path.
    const isHiddenRouteFile = (file: string) =>
      file.startsWith(path.join(ROOT, "app", "private-shelf") + path.sep) ||
      file.startsWith(path.join(ROOT, "components", "talisbooks", "hidden") + path.sep) ||
      file.startsWith(path.join(ROOT, "lib", "talisbooks", "hidden-"));
    const leaks = files.filter(
      (file) =>
        !allowed.has(file) &&
        !isHiddenRouteFile(file) &&
        readFileSync(file, "utf8").includes("private-shelf"),
    );
    expect(leaks.map((file) => path.relative(ROOT, file))).toEqual([]);

    // Only the hidden routes themselves import the registry.
    const importers = files
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) => /hidden-bookshelf["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file))
      .sort();
    expect(importers).toEqual(
      [
        "app/private-shelf/[slug]/page.tsx",
        "app/private-shelf/page.tsx",
        "components/talisbooks/hidden/HiddenBookshelfView.tsx",
      ].sort(),
    );

    expect(read("lib/seo/pages.json")).not.toContain("private-shelf");
    expect(indexablePageRoutes().some((route) => route.includes("private-shelf"))).toBe(false);
    for (const nav of [
      "components/Header.tsx",
      "components/Footer.tsx",
      "components/talisu/TalisUMktsHeader.tsx",
    ]) {
      if (existsSync(path.join(ROOT, nav))) {
        expect(read(nav)).not.toMatch(/private-shelf|HIDDEN_BOOKSHELF|hiddenBookHref/);
      }
    }
    // RootShell only uses the path check to drop storefront chrome.
    expect(read("components/RootShell.tsx")).toContain("isHiddenBookshelfPath(pathname)");
  });
});

describe("hidden bookshelf registry", () => {
  it("lists Tsplits™ Journey as the first hidden book", () => {
    expect(HIDDEN_BOOKS.length).toBeGreaterThanOrEqual(1);
    expect(HIDDEN_BOOKS[0]!.slug).toBe("tsplits-journey");
    const slugs = HIDDEN_BOOKS.map((book) => book.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(journey.title).toBe("Tsplits™ Journey");
    expect(getHiddenBook("nope")).toBeNull();
  });

  it("is a 30-page book: cover, 14 spreads, back cover", () => {
    expect(journey.spreads).toBe(14);
    expect(hiddenBookPageCount(journey)).toBe(30);
    expect(journey.pages.map((page) => page.pageNumber)).toEqual(
      Array.from({ length: 28 }, (_, index) => index + 2),
    );
    const viewer = createHiddenViewerBook(journey);
    expect(viewer.pages).toHaveLength(30);
    expect(viewer.pages[0]!.heroImageUrl).toBe(journey.frontCover);
    expect(viewer.pages.at(-1)!.heroImageUrl).toBe(journey.backCover);
    expect(viewer.pages[1]!.spreadImageUrl).toBe(`${journey.assetBase}/spread-01.jpg`);
  });

  it("ships every cover, spread, screenshot and illustration", () => {
    for (const book of HIDDEN_BOOKS) {
      const pub = (url: string) => path.join(ROOT, "public", url);
      expect(jpegSize(pub(book.frontCover))).toEqual({ width: 1200, height: 1340 });
      expect(jpegSize(pub(book.backCover))).toEqual({ width: 1200, height: 1340 });
      expect(jpegSize(pub(book.coverImage))).toEqual({ width: 600, height: 840 });
      for (let spread = 1; spread <= book.spreads; spread += 1) {
        const file = pub(`${book.assetBase}/spread-${String(spread).padStart(2, "0")}.jpg`);
        expect(jpegSize(file)).toEqual({ width: 2400, height: 1340 });
      }
      for (const page of book.pages) {
        for (const block of page.blocks) {
          if (block.type === "image" || block.type === "illus") {
            expect(existsSync(pub(block.src)), block.src).toBe(true);
          }
        }
      }
    }
  });

  it("follows the verified timeline and signs off as Arun", () => {
    const text = lines.join("\n");
    for (const milestone of [
      "February 2026",
      "SimpleTexting",
      "Phase 1 blueprint",
      "March 31",
      "April 2",
      "June 23",
      "Build A MapSite",
      "Claim A Market",
      "FAST Codes",
      "TEB™",
      "Aisha",
      "Webster",
      "TVA™",
      "DC 06 Chagatown",
      "English, French, Spanish and German",
      "full-page Mapsite Dashboard editor",
      "The Founder's Mapsite Sample",
      "@tsplits.com",
      "Talisman Simple Project Lead & Income Tracking System",
      "PLACEHOLDER FOR RALF",
    ]) {
      expect(text, milestone).toContain(milestone);
    }
    const last = journey.pages.at(-1)!;
    expect(last.blocks).toContainEqual({
      type: "signoff",
      name: "Arun Rachuri",
      role: "EN01 — Tsplits™ / Founder, Powermycode Solutions",
    });
  });
});

describe("Tsplits™ Journey copy exclusions", () => {
  it("never mentions Kyptronix, dev jargon, money, marketing or extra effort", () => {
    const banned = [
      /kyptronix/i,
      /supabase/i,
      /next\.?js/i,
      /\bgit\b/i,
      /github/i,
      /\bcommits?\b/i,
      /\bAPI\b/,
      /\bSSR\b/,
      /vercel/i,
      /typescript/i,
      /database/i,
      /\bdeploy/i,
      /endpoint/i,
      /\bbranch/i,
      /pull request|\bPRs?\b/,
      /\bcode ?base\b/i,
      /marketing/i,
      /advertis/i,
      /\bads?\b/i,
      /campaign/i,
      /caller/i,
      /aritri|enanko/i,
      /pric(e|ing)/i,
      /retainer/i,
      /budget/i,
      /invoice/i,
      /money/i,
      /dollar|\$|USD|CAD/,
      /\bfees?\b/i,
      /extra effort|late nights?|hard work|overtime|favou?r/i,
    ];
    for (const line of lines) {
      for (const pattern of banned) {
        expect(line, `${pattern} in: ${line}`).not.toMatch(pattern);
      }
    }
  });

  it("spells Ralf and Tsplits™ correctly", () => {
    for (const line of lines) {
      // Every Tsplits carries ™ (the @tsplits.com address is lowercase).
      expect(line, line).not.toMatch(/Tsplits(?!™)|TSPLITS(?!™)/);
      expect(line, line).not.toMatch(/Mapsites?™|FAST Codes?™/);
    }
    const ralph = journey.pages.flatMap((page) =>
      page.blocks.filter((block) => blockText(block).some((t) => t.includes("Ralph"))),
    );
    // "Ralph" only appears inside the verified oops story about the misspelling.
    expect(ralph).toHaveLength(1);
    expect(ralph[0]!.type).toBe("oops");
    expect(blockText(ralph[0]!).join(" ")).toMatch(/by mistake/);
    expect(lines.join(" ")).toContain("Ralf");
  });

  it("uses no em-dashes except in the sign-off", () => {
    for (const page of journey.pages) {
      for (const block of page.blocks) {
        if (block.type === "signoff") continue;
        for (const text of [page.kicker, page.title, ...blockText(block)]) {
          expect(text, text).not.toContain("—");
        }
      }
    }
    for (const text of [journey.title, journey.subtitle, journey.description]) {
      expect(text).not.toContain("—");
    }
  });
});
