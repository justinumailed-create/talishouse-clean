import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAPSITE_DASHBOARD_MENU_ITEMS,
  applyBookshelfOrder,
  insertBookAt,
  isAllowedOwnerImageUrl,
  normalizeBookshelfOrder,
  nudgeBook,
  swapBooks,
} from "../lib/talispros/mapsite-owner-customizations";
import { partitionBookshelf } from "../lib/talisbooks/library/partition";
import type { TalisBooksLibraryBook } from "../lib/talisbooks/library/types";

function book(id: string, createdAt: string): TalisBooksLibraryBook {
  return {
    id,
    slug: id,
    title: id.toUpperCase(),
    subtitle: "",
    coverImageUrl: null,
    coverTemplateId: null,
    coverGradient: "#000",
    publishStatus: "published",
    publishedAt: createdAt,
    createdAt,
    views: 0,
    clicks: 0,
    pageCount: 1,
    accountId: null,
    accountType: "root",
    mapsiteId: null,
    fastCode: "rm22",
    parentBookId: null,
  };
}

describe("Mapsite owner Dashboard menu", () => {
  it("lists the four Dashboard items in navbar order", () => {
    expect(MAPSITE_DASHBOARD_MENU_ITEMS.map((item) => item.label)).toEqual([
      "Ebook Editor",
      "Logo & Card Editor",
      "PIN Dashboard",
      "Bookshelf Editor",
    ]);
  });

  it("gates the dropdown on paid + owner/admin and keeps PIN Dashboard", () => {
    const app = readFileSync(
      resolve("components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    const header = readFileSync(resolve("components/talisu/TalisUMktsHeader.tsx"), "utf8");
    const page = readFileSync(
      resolve("app/talispros/mapsite/[accountType]/[fastCode]/page.tsx"),
      "utf8",
    );
    const actions = readFileSync(resolve("app/talispros/mapsite/dashboard-actions.ts"), "utf8");

    expect(app).toContain("const dashboardManageable = dashboardUnlocked && canManageDashboard");
    expect(app).toContain('dashboardPanel === "pins" && dashboardManageable');
    expect(app).toContain("MapSiteLogoImageEditor");
    expect(app).toContain("MapSiteBookshelfEditor");
    expect(header).toContain("dashboardHasMenu");
    expect(header).toContain('role="menuitem"');
    expect(header).toContain("bg-[#035bb8]");
    expect(page).toContain("const canManageDashboard = isOwner || Boolean(editAccess?.isAdmin)");
    expect(actions).toContain("requireMapSiteEditAccess");
    expect(actions).toContain("FAST Code™ does not match this Mapsite.");
  });
});

describe("Bookshelf Editor ordering", () => {
  const ids = ["a", "b", "c", "d"];

  it("inserts a dragged book at the drop target", () => {
    expect(insertBookAt(ids, "d", "b")).toEqual(["a", "d", "b", "c"]);
    expect(insertBookAt(ids, "a", "c")).toEqual(["b", "c", "a", "d"]);
    expect(insertBookAt(ids, "a", "zzz")).toEqual(ids);
  });

  it("swaps when dropping one book onto another", () => {
    expect(swapBooks(ids, "a", "d")).toEqual(["d", "b", "c", "a"]);
  });

  it("nudges with keyboard / arrow buttons within bounds", () => {
    expect(nudgeBook(ids, "b", -1)).toEqual(["b", "a", "c", "d"]);
    expect(nudgeBook(ids, "a", -1)).toEqual(ids);
    expect(nudgeBook(ids, "d", 1)).toEqual(ids);
  });

  it("applies a saved order and keeps new books after it", () => {
    const books = ["n", "a", "b", "c"].map((id) => ({ id }));
    expect(applyBookshelfOrder(books, ["c", "a", "gone"]).map((b) => b.id)).toEqual([
      "c",
      "a",
      "n",
      "b",
    ]);
    expect(applyBookshelfOrder(books, [])).toBe(books);
  });

  it("normalizes stored order JSON", () => {
    expect(normalizeBookshelfOrder(["a", " a ", "", 3, "b"])).toEqual(["a", "b"]);
    expect(normalizeBookshelfOrder({ a: 1 })).toEqual([]);
  });

  it("ordered shelf mode keeps owner order with book 1 as hero", () => {
    const books = [
      book("old", "2024-01-01T00:00:00Z"),
      book("newest", "2026-01-01T00:00:00Z"),
      book("mid", "2025-01-01T00:00:00Z"),
    ];
    const ordered = partitionBookshelf(books, { featuredMode: "ordered" });
    expect(ordered.featured.map((b) => b.id)).toEqual(["old"]);
    expect(ordered.general.map((b) => b.id)).toEqual(["newest", "mid"]);
    const newest = partitionBookshelf(books, { featuredMode: "newest" });
    expect(newest.featured[0]?.id).toBe("newest");
  });
});

describe("Logo & Image Editor URL policy", () => {
  const base = "https://proj.supabase.co";
  it("accepts only this project's public storage URLs", () => {
    expect(
      isAllowedOwnerImageUrl(
        `${base}/storage/v1/object/public/talisbooks-assets/auto-draft/rm22/x-logo.webp`,
        base,
      ),
    ).toBe(true);
    expect(isAllowedOwnerImageUrl("https://evil.example/x.png", base)).toBe(false);
    expect(isAllowedOwnerImageUrl(`${base}/storage/v1/object/sign/x`, base)).toBe(false);
    expect(isAllowedOwnerImageUrl("", base)).toBe(false);
    expect(isAllowedOwnerImageUrl(`${base}/storage/v1/object/public/a`, null)).toBe(false);
  });
});
