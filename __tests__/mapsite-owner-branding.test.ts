import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  mapsiteBrandingOgVersion,
  resolveMapSiteBranding,
  resolveMapSiteLogoUrl,
  withOwnerLogo,
  withOwnerLogoUrl,
} from "@/lib/talispros/mapsite-branding";
import {
  MAPSITE_DASHBOARD_MENU_ITEMS,
  MAPSITE_PARTNER_TEXT_LIMITS,
  normalizePartnerText,
} from "@/lib/talispros/mapsite-owner-customizations";
import { resolveMapSiteOgImage } from "@/lib/talispros/mapsite-og-image";
import {
  applyFirstPageCovers,
  firstPageImageFromContent,
  pickFirstPageImages,
} from "@/lib/talisbooks/library/first-page-cover";
import {
  PAGE_RENUMBER_TEMP_OFFSET,
  planTwoPassPageRenumber,
} from "@/lib/talisbooks/renumber-book-pages";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const defaults = {
  logoUrl: "https://x.supabase.co/storage/v1/object/public/a/default-logo.png",
  partnerImageUrl: "/talispros/aisha.png",
  partnerName: "Aisha C.",
  partnerTagline: "I am your Marketing Partner...",
};

describe("mapsite branding resolver", () => {
  it("falls back to defaults with no overrides", () => {
    const resolved = resolveMapSiteBranding(defaults, null);
    expect(resolved).toMatchObject(defaults);
    expect(Object.values(resolved.overridden).some(Boolean)).toBe(false);
  });

  it("applies every owner override", () => {
    const resolved = resolveMapSiteBranding(defaults, {
      logoUrl: "https://x/custom-logo.png",
      partnerImageUrl: "https://x/custom-photo.png",
      partnerName: "Ralf M.",
      partnerTagline: "Your local lot expert",
    });
    expect(resolved.logoUrl).toBe("https://x/custom-logo.png");
    expect(resolved.partnerImageUrl).toBe("https://x/custom-photo.png");
    expect(resolved.partnerName).toBe("Ralf M.");
    expect(resolved.partnerTagline).toBe("Your local lot expert");
    expect(resolved.overridden).toEqual({
      logo: true,
      partnerImage: true,
      partnerName: true,
      partnerTagline: true,
    });
  });

  it("treats blank overrides as reset to default", () => {
    const resolved = resolveMapSiteBranding(defaults, { partnerName: "  ", logoUrl: "" });
    expect(resolved.partnerName).toBe("Aisha C.");
    expect(resolved.logoUrl).toBe(defaults.logoUrl);
  });

  it("overrides logo on records and views without touching other fields", () => {
    const record = { id: "1", logo_url: "a.png" };
    expect(withOwnerLogo(record, { logoUrl: "b.png" })).toEqual({ id: "1", logo_url: "b.png" });
    expect(withOwnerLogo(record, null)).toBe(record);
    expect(withOwnerLogoUrl({ logoUrl: null }, { logoUrl: "b.png" }).logoUrl).toBe("b.png");
    expect(resolveMapSiteLogoUrl("a.png", { logoUrl: null })).toBe("a.png");
  });

  it("versions the og:image only when a custom logo exists", () => {
    expect(mapsiteBrandingOgVersion(null)).toBeNull();
    const version = mapsiteBrandingOgVersion({
      logoUrl: "b.png",
      updatedAt: "2026-10-06T10:00:00Z",
    });
    expect(version).toBe(String(Date.parse("2026-10-06T10:00:00Z") / 1000));
    expect(resolveMapSiteOgImage("RM22", version)).toMatch(/\/api\/og\/mapsite\/rm22\?v=\d+$/);
    expect(resolveMapSiteOgImage("RM22")).toMatch(/\/api\/og\/mapsite\/rm22$/);
  });
});

describe("partner text limits", () => {
  it("normalizes whitespace and rejects over-limit text", () => {
    expect(normalizePartnerText("  Ralf \n  M. ", "partnerName")).toEqual({
      value: "Ralf M.",
      tooLong: false,
    });
    expect(normalizePartnerText("", "partnerTagline").value).toBeNull();
    expect(
      normalizePartnerText("x".repeat(MAPSITE_PARTNER_TEXT_LIMITS.partnerName + 1), "partnerName")
        .tooLong,
    ).toBe(true);
    expect(MAPSITE_PARTNER_TEXT_LIMITS).toEqual({ partnerName: 60, partnerTagline: 140 });
  });

  it("matches the DB limits in migration 094", () => {
    const sql = read("supabase/migrations/094_mapsite_owner_partner_text.sql");
    expect(sql).toContain("char_length(partner_name) between 1 and 60");
    expect(sql).toContain("char_length(partner_tagline) between 1 and 140");
    expect(sql).not.toMatch(/drop\s+(table|column)/i);
  });

  it("is enforced server-side behind the owner gate", () => {
    const actions = read("app/talispros/mapsite/dashboard-actions.ts");
    expect(actions).toContain("export async function saveMapSitePartnerTextAction");
    expect(actions).toMatch(/saveMapSitePartnerTextAction[\s\S]*authorizeOwner\(input\)/);
    expect(actions).toContain("normalized.tooLong");
  });

  it("renames the dropdown item to cover the card", () => {
    expect(MAPSITE_DASHBOARD_MENU_ITEMS.map((item) => item.label)).toContain("Logo & Card Editor");
  });
});

describe("logo override applies everywhere", () => {
  it("routes every logo surface through the resolver", () => {
    expect(read("components/talispros/mapsite/MapSiteApplication.tsx")).toContain(
      "resolveMapSiteBranding(",
    );
    expect(read("components/mapsite/PublishedMapSiteView.tsx")).toContain("withOwnerLogoUrl(");
    expect(read("components/mapsite/PublishedMapSiteView.tsx")).toContain(
      "resolveBrandedMapSiteOgImage(",
    );
    expect(read("app/talispros/mapsite/[accountType]/[fastCode]/page.tsx")).toContain(
      "resolveBrandedMapSiteOgImage(",
    );
    expect(read("app/mapsite/[slug]/map/page.tsx")).toContain("resolveBrandedMapSiteOgImage(");
    expect(read("app/api/og/mapsite/[fastCode]/route.ts")).toContain("mapsiteShareOgLogo(code)");
    expect(read("app/talispros/ebook-generate/page.tsx")).toContain(
      "resolveMapSiteLogoUrlForServer(",
    );
    expect(read("app/talispros/mapsites/[fastCode]/ebooks/new/page.tsx")).toContain(
      "resolveMapSiteLogoUrlForServer(",
    );
  });

  it("never writes the override over the Mapsite default logo", () => {
    const autoDraft = read("lib/talisbooks/auto-draft-ebook.ts");
    expect(autoDraft).toContain("rawLogo === input.ownerLogoUrl.trim()");
  });
});

describe("first-page cover thumbnails", () => {
  it("reads the first-page image", () => {
    expect(firstPageImageFromContent({ layout: "cover", heroImageUrl: " a.webp " })).toBe("a.webp");
    expect(firstPageImageFromContent({ spreadImageUrl: "s.webp" })).toBe("s.webp");
    expect(firstPageImageFromContent({ title: "x" })).toBeNull();
    expect(firstPageImageFromContent(null)).toBeNull();
  });

  it("picks the lowest page with an image and falls back to the stored cover", () => {
    const images = pickFirstPageImages([
      { book_id: "b1", page_number: 2, content: { heroImageUrl: "p2.webp" } },
      { book_id: "b1", page_number: 1, content: { heroImageUrl: "p1.webp" } },
      { book_id: "b2", page_number: 1, content: { title: "no image" } },
    ]);
    const books = applyFirstPageCovers(
      [
        { id: "b1", coverImageUrl: "meta.webp" },
        { id: "b2", coverImageUrl: "meta2.webp" },
        { id: "b3", coverImageUrl: null },
      ],
      images,
    );
    expect(books.map((book) => book.coverImageUrl)).toEqual(["p1.webp", "meta2.webp", null]);
  });

  it("is applied to every FAST-Code shelf", () => {
    const service = read("lib/talisbooks/library/bookshelf-service.ts");
    expect(service).toContain("await withFirstPageCovers(incoming)");
  });
});

/** In-memory table with UNIQUE (book_id, page_number), like production. */
function fakePagesClient(pages: Array<{ id: string; book_id: string; page_number: number }>) {
  return {
    from() {
      let patch: Record<string, unknown> = {};
      const filters: Record<string, string> = {};
      const builder = {
        update(next: Record<string, unknown>) {
          patch = next;
          return builder;
        },
        eq(column: string, value: string) {
          filters[column] = value;
          if (filters.id && filters.book_id) {
            const row = pages.find((p) => p.id === filters.id && p.book_id === filters.book_id);
            const target = patch.page_number as number;
            const clash = pages.find(
              (p) => p !== row && p.book_id === filters.book_id && p.page_number === target,
            );
            if (clash) {
              return Promise.resolve({ error: { message: "duplicate key value violates unique constraint" } });
            }
            if (row) row.page_number = target;
            return Promise.resolve({ error: null });
          }
          return builder;
        },
      };
      return builder;
    },
  };
}

describe("two-pass page renumber (reorderAdminEbookPages fix)", () => {
  it("plans temp numbers then final numbers", () => {
    const plan = planTwoPassPageRenumber(["a", "b"]);
    expect(plan.map((step) => step.pageNumber)).toEqual([
      PAGE_RENUMBER_TEMP_OFFSET + 1,
      PAGE_RENUMBER_TEMP_OFFSET + 2,
      1,
      2,
    ]);
  });

  it("swaps pages without tripping the unique index", async () => {
    const { renumberBookPagesTwoPass } = await import("@/lib/talisbooks/renumber-book-pages");
    const pages = [
      { id: "a", book_id: "book", page_number: 1 },
      { id: "b", book_id: "book", page_number: 2 },
      { id: "c", book_id: "book", page_number: 3 },
    ];
    const client = fakePagesClient(pages);
    const result = await renumberBookPagesTwoPass(client as never, "book", ["c", "a", "b"]);
    expect(result).toEqual({ success: true });
    expect(Object.fromEntries(pages.map((p) => [p.id, p.page_number]))).toEqual({ c: 1, a: 2, b: 3 });
  });

  it("a single pass would have collided (regression guard)", async () => {
    const pages = [
      { id: "a", book_id: "book", page_number: 1 },
      { id: "b", book_id: "book", page_number: 2 },
    ];
    const client = fakePagesClient(pages);
    type Chain = {
      update: (patch: Record<string, unknown>) => {
        eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: unknown }> };
      };
    };
    const single = await (client.from() as unknown as Chain)
      .update({ page_number: 1 })
      .eq("id", "b")
      .eq("book_id", "book");
    expect(single.error).not.toBeNull();
  });

  it("is used by both the admin and owner editors", () => {
    expect(read("lib/talisbooks/admin-ebook-pages.ts")).toMatch(
      /reorderAdminEbookPages[\s\S]*renumberBookPagesTwoPass\(/,
    );
    expect(read("lib/talisbooks/owner-ebook-editor.ts")).toContain("renumberBookPagesTwoPass(");
  });
});
