import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  flattenUnits,
  groupOwnerEbookUnits,
  moveUnit,
  ownerEbookPageFromRow,
  sanitizeOwnerPagePatch,
  type OwnerEbookPage,
} from "@/lib/talisbooks/owner-ebook-editor-model";
import { safeMapSiteBackHref, ownerEbookEditorPath } from "@/lib/talispros/owner-ebook-routes";

function page(id: string, pageNumber: number, layout: string, extra: Partial<OwnerEbookPage> = {}): OwnerEbookPage {
  return {
    id,
    pageNumber,
    slug: id,
    layout,
    templateId: null,
    locked: false,
    text: {},
    images: {},
    captionsEnabled: false,
    ...extra,
  };
}

const book = [
  page("front", 1, "cover"),
  page("l1", 2, "centerfold_left"),
  page("r1", 3, "centerfold_right"),
  page("l2", 4, "centerfold_left"),
  page("r2", 5, "centerfold_right"),
  page("copy", 6, "split_copy"),
  page("back", 7, "cover"),
];

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("owner ebook editor model", () => {
  it("groups covers, spreads, and pages", () => {
    const units = groupOwnerEbookUnits(book);
    expect(units.map((unit) => unit.kind)).toEqual([
      "front-cover",
      "spread",
      "spread",
      "page",
      "back-cover",
    ]);
    expect(units[1]!.pages.map((p) => p.id)).toEqual(["l1", "r1"]);
  });

  it("moves spreads as a unit but never past covers or locked pages", () => {
    const units = groupOwnerEbookUnits(book);
    const moved = moveUnit(units, "l2", -1);
    expect(flattenUnits(moved)).toEqual(["front", "l2", "r2", "l1", "r1", "copy", "back"]);
    expect(moveUnit(units, "l1", -1)).toBe(units);
    expect(moveUnit(units, "copy", 1)).toBe(units);
    const locked = groupOwnerEbookUnits([
      ...book.slice(0, 5),
      page("copy", 6, "split_copy", { locked: true }),
      book[6]!,
    ]);
    expect(moveUnit(locked, "l2", 1)).toBe(locked);
  });

  it("whitelists text and image fields", () => {
    const patch = sanitizeOwnerPagePatch({
      text: { title: "Hi", body: "B", layout: "evil", exactPdfPage: 3 } as Record<string, unknown>,
      images: { spreadImageUrl: " https://x/y.png ", pdfUrl: "nope" } as Record<string, unknown>,
      captionsEnabled: true,
    });
    expect(patch.text).toEqual({ title: "Hi", body: "B" });
    expect(patch.images).toEqual({ spreadImageUrl: "https://x/y.png" });
    expect(patch.captionsEnabled).toBe(true);
  });

  it("marks system pages locked", () => {
    expect(
      ownerEbookPageFromRow({ id: "a", page_number: 1, slug: null, title: "T", content: { systemKey: "x" } }).locked,
    ).toBe(true);
    const row = ownerEbookPageFromRow({ id: "a", page_number: 1, slug: null, title: "T", content: { layout: "split_copy" } });
    expect(row.locked).toBe(false);
    expect(row.text.title).toBe("T");
  });
});

describe("owner ebook editor routes and gating", () => {
  it("only accepts same-site Mapsite back links", () => {
    const fallback = { fastCode: "RM22", accountType: "FSBO" };
    expect(safeMapSiteBackHref("/talispros/mapsite/fsbo/rm22", fallback)).toBe("/talispros/mapsite/fsbo/rm22");
    expect(safeMapSiteBackHref("https://evil.example", fallback)).toMatch(/^\/talispros\/mapsite\//);
    expect(safeMapSiteBackHref("//evil.example", fallback)).toMatch(/^\/talispros\/mapsite\//);
    expect(ownerEbookEditorPath("RM22", "b1")).toBe("/talispros/mapsites/rm22/ebooks/b1");
  });

  it("enforces ownership on the server", () => {
    const actions = read("app/talispros/mapsite/ebook-editor-actions.ts");
    expect(actions).toContain("requireMapSiteEditAccess");
    const service = read("lib/talisbooks/owner-ebook-editor.ts");
    expect(service).toContain("assertOwnerBook");
    const editorPage = read("app/talispros/mapsites/[fastCode]/ebooks/[bookId]/page.tsx");
    expect(editorPage).toContain("canEditMapSite");
    const createPage = read("app/talispros/mapsites/[fastCode]/ebooks/new/page.tsx");
    expect(createPage).toContain("canEditMapSite");
    expect(createPage).toContain("MapSiteAdminEbookPanel");
  });

  it("shows the Ebook Editor in the Dashboard dropdown", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain('dashboardPanel === "ebooks"');
    expect(app).not.toContain('item.id !== "ebooks"');
  });
});
