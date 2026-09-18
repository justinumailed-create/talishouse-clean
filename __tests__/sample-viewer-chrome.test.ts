import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  viewerFastCodeLabel,
  viewerGoogleMapsHref,
  viewerMapsiteHref,
} from "../lib/talisbooks/viewer/location";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("sample Talisbooks™ viewer chrome", () => {
  const shell = readSource("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
  const startPage = readSource("components/talispros/TalisprosStartPage.tsx");
  const standingBook = readSource(
    "components/talisbooks/library/TalisBooksStandingBook.tsx",
  );

  it("does not show magazine title chrome or Mapsite™ / sample CTAs above the book", () => {
    expect(shell).not.toContain("talisbooks-viewer__header");
    expect(shell).not.toContain("Talisbooks™ Magazine");
    expect(shell).not.toContain("Back to Mapsite™");
    expect(shell).not.toContain('"Build Demo"');
    expect(shell).not.toContain("Global Admin");
    expect(shell).not.toContain("TALISBOOKS_ROUTES.DASHBOARD");
    expect(shell).not.toContain(">Dashboard<");
  });

  it("hides playback and Live Edit so the stage can use the full 16:9 width", () => {
    expect(shell).toContain("const showViewerSidebar = false");
    expect(shell).toContain("TalisBooksViewerBrandRail");
    expect(shell).toContain("TalisBooksViewerPlaybackRail");
  });

  it("shows Live Edit only after payment, never on demonstration books", () => {
    expect(shell).toContain("pageInsertLocked");
    const liveEditor = readSource(
      "components/talisbooks/viewer/TalisBooksViewerLiveEditor.tsx",
    );
    expect(liveEditor).toContain("pageInsertLocked");
    expect(liveEditor).toContain("talisbooks-viewer-live-edit--page-insert-locked");
    const viewerPage = readSource("app/talisbooks/viewer/[slug]/page.tsx");
    expect(viewerPage).toContain("isDemonstrationCatalogBook");
    expect(viewerPage).toContain("pageInsertLocked={isDemoBook}");
    expect(viewerPage).toContain(
      "const canLiveEdit = !isDemoBook && paymentReceived && canEditTools;",
    );
    expect(viewerPage).not.toContain("isAdmin || (!isDemoBook && paymentReceived");
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

describe("viewer edge chrome", () => {
  it("capitalizes the FAST Code label", () => {
    expect(viewerFastCodeLabel("rm22")).toBe("RM22");
    expect(viewerFastCodeLabel("  ")).toBeNull();
  });

  it("opens Google Maps from coordinates or the book address", () => {
    expect(
      viewerGoogleMapsHref({
        title: "Ralf Meyer",
        subtitle: "160 Macs Rd",
        pages: [{ latitude: 45.7, longitude: -61.1 }],
      }),
    ).toBe("https://www.google.com/maps/search/?api=1&query=45.7,-61.1");
    expect(
      viewerGoogleMapsHref({
        title: "Ralf Meyer",
        subtitle: "160 Macs Rd, Richmond County",
        pages: [],
      }),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=160%20Macs%20Rd%2C%20Richmond%20County",
    );
  });

  it("sends the Talispros™ logo to the claimed Mapsite™", () => {
    expect(viewerMapsiteHref({ fastCode: "rm22", accountType: "root" })).toBe(
      "/talispros/mapsite/root/rm22",
    );
  });
});
