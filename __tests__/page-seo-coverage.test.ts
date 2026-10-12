import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PAGE_SEO,
  buildAdminMetadata,
  buildPageMetadata,
  pageOgImagePath,
  type PageSeoRoute,
} from "../lib/seo/page-seo";

/**
 * Standing rule: every page gets its own title, description and a dedicated
 * 1200×630 share card (EN + DE). A new app/**\/page.tsx fails here until it is
 * registered in scripts/og/pages_src.py (then `python3 scripts/og/generate.py`)
 * and calls pageMetadata("<route>"), or is an internal tool under an
 * adminMetadata() layout.
 */

const APP = path.join(process.cwd(), "app");
const PUBLIC = path.join(process.cwd(), "public");

/** Pages that only redirect() and never render. */
const REDIRECT_ONLY = new Set([
  "/a/[fastCode]",
  "/admin/bookshelves",
  "/business-office/propose-project",
  "/checkout",
  "/dealers",
  "/products/talisforms",
  "/propose-project",
  "/talispros/marketing/login",
  "/talispros/start",
  "/talispros/start/fsbo",
  "/talispros/welcome",
  "/talisu/catalogue",
  "/talisu/demo",
  "/talisu/eb",
]);

function findPages(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) findPages(full, out);
    else if (name === "page.tsx") out.push(full);
  }
  return out;
}

function routeOf(file: string): string {
  const rel = path.relative(APP, path.dirname(file)).split(path.sep);
  const segs = rel.filter((s) => s && !/^\(.*\)$/.test(s));
  return `/${segs.join("/")}`;
}

function jpegSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error(`no SOF in ${file}`);
}

const pages = findPages(APP).map((file) => ({ file, route: routeOf(file) }));

function ancestorLayouts(file: string): string[] {
  const out: string[] = [];
  let dir = path.dirname(file);
  while (dir.startsWith(APP)) {
    const l = path.join(dir, "layout.tsx");
    if (existsSync(l)) out.push(readFileSync(l, "utf8"));
    if (dir === APP) break;
    dir = path.dirname(dir);
  }
  return out;
}

describe("every page has page-specific SEO and a share card", () => {
  it("finds the app routes", () => {
    expect(pages.length).toBeGreaterThan(150);
  });

  for (const { file, route } of pages) {
    if (REDIRECT_ONLY.has(route)) continue;
    const src = readFileSync(file, "utf8");
    const entry = PAGE_SEO[route];

    it(`${route}`, () => {
      if (!entry) {
        // Internal tools: shared noindex "Talispros™ Admin" card.
        const ownsMetadata = /generateMetadata|export const metadata/.test(src);
        if (ownsMetadata) {
          expect(src, `${route}: register it in scripts/og/pages_src.py`).toMatch(/adminMetadata\(/);
        } else {
          expect(
            ancestorLayouts(file).some((l) => l.includes("adminMetadata(")),
            `${route} has no page SEO: register it in scripts/og/pages_src.py and call pageMetadata("${route}")`,
          ).toBe(true);
        }
        return;
      }
      if (entry.kind === "dynamic") {
        expect(src).toMatch(/generateMetadata/);
        expect(src).toMatch(
          /dynamicPageMetadata|publishedMapSiteMetadata|OgMetadataImage|\/api\/og\//,
        );
        return;
      }
      if (entry.kind === "custom") {
        expect(src).toMatch(/generateMetadata/);
        expect(src).toMatch(/ogImage/);
        for (const locale of ["en", "de"]) {
          expect(existsSync(path.join(PUBLIC, `${entry.image}-${locale}.jpg`))).toBe(true);
        }
        return;
      }
      expect(src).toContain(`pageMetadata("${route}")`);
      for (const locale of ["en", "de"] as const) {
        const copy = entry[locale]!;
        expect(copy.title.length, copy.title).toBeLessThanOrEqual(60);
        expect(copy.description.length, copy.description).toBeLessThanOrEqual(155);
        const text = `${copy.title} ${copy.description} ${copy.alt}`;
        expect(text).not.toMatch(/Mapsites?™|USD|\$/);
        const img = path.join(PUBLIC, pageOgImagePath(entry.image!, locale));
        expect(existsSync(img), img).toBe(true);
        expect(jpegSize(img)).toEqual({ width: 1200, height: 630 });

        const meta = buildPageMetadata(route as PageSeoRoute, locale);
        const og = meta.openGraph as Record<string, unknown>;
        const [image] = og.images as Array<Record<string, unknown>>;
        expect(meta.title).toBe(copy.title);
        expect(og.title).toBe(copy.title);
        expect(og.description).toBe(copy.description);
        expect(image).toMatchObject({
          url: `https://www.talispros.com/og/pages/${path.basename(img)}`,
          width: 1200,
          height: 630,
          alt: copy.alt,
        });
        expect(og.locale).toBe(locale === "de" ? "de_DE" : "en_US");
        expect(String(og.url)).toMatch(locale === "de" ? /\?lang=de$/ : /^https:\/\/www\.talispros\.com/);
        expect((meta.twitter as Record<string, unknown>).card).toBe("summary_large_image");
        const robots = meta.robots as { index: boolean };
        expect(robots.index).toBe(entry.kind === "public");
      }
    });
  }

  it("admin card is shared, noindex, 1200×630 in EN and DE", () => {
    for (const locale of ["en", "de"] as const) {
      const meta = buildAdminMetadata(locale, "Leads");
      expect(meta.title).toBe("Leads | Talispros™ Admin");
      expect((meta.robots as { index: boolean }).index).toBe(false);
      const img = path.join(PUBLIC, `og/pages/admin-${locale}.jpg`);
      expect(jpegSize(img)).toEqual({ width: 1200, height: 630 });
    }
  });
});
