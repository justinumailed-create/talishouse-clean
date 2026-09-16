import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("sample Talisbooks™ viewer chrome", () => {
  const shell = readSource("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
  const startPage = readSource("components/talispros/TalisprosStartPage.tsx");
  const standingBook = readSource(
    "components/talisbooks/library/TalisBooksStandingBook.tsx",
  );

  it("labels the sample mapsite CTA without Build", () => {
    expect(shell).toContain('"Demo Mapsite™"');
    expect(shell).not.toMatch(/Build Demo/i);
  });

  it("places Global Admin beside the sample mapsite CTA", () => {
    expect(shell).toContain("Global Admin");
    expect(shell).toContain("ROUTES.ADMIN_DASHBOARD");
  });

  it("greys out insert-page Live Edit on demonstration books", () => {
    expect(shell).toContain("pageInsertLocked");
    const liveEditor = readSource(
      "components/talisbooks/viewer/TalisBooksViewerLiveEditor.tsx",
    );
    expect(liveEditor).toContain("pageInsertLocked");
    expect(liveEditor).toContain("talisbooks-viewer-live-edit--page-insert-locked");
    const viewerPage = readSource("app/talisbooks/viewer/[slug]/page.tsx");
    expect(viewerPage).toContain("isDemonstrationCatalogBook");
    expect(viewerPage).toContain("pageInsertLocked={isDemoBook}");
  });

  it("opens ebook icons in the same tab", () => {
    expect(startPage).not.toContain('target="_blank"');
    expect(startPage).not.toContain("noopener");
    expect(startPage).not.toMatch(/new tab/i);
    expect(standingBook).not.toContain('target="_blank"');
    expect(standingBook).not.toContain("noopener");
    expect(standingBook).not.toMatch(/new tab/i);
  });
});
