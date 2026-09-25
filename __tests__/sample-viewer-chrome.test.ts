import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  viewerBackToMapsiteHref,
  viewerFastCodeLabel,
  viewerGoogleMapsHref,
  viewerMapsiteFastCode,
  viewerMapsiteHref,
} from "../lib/talisbooks/viewer/location";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("sample Talisbooks™ viewer chrome", () => {
  const shell = readSource("components/talisbooks/viewer/TalisBooksViewerShell.tsx");
  const startPage = readSource("components/talispros/TalisprosStartPage.tsx");
  const homeMap = readSource("components/talispros/TalisprosHomeMapPreview.tsx");
  const standingBook = readSource(
    "components/talisbooks/library/TalisBooksStandingBook.tsx",
  );

  it("omits the Demo Mapsite™ header button on the sample viewer", () => {
    expect(shell).not.toContain('"Demo Mapsite™"');
    expect(shell).not.toContain("DEMO_MAPSITE_BUILD_PATH");
    expect(shell).not.toMatch(/Build Demo/i);
  });

  it("places Home, Product, Download PDF, Markets, then Global Admin on the sample toolbar", () => {
    expect(shell).toMatch(
      /href=\{ROUTES\.HOME\}[\s\S]*href=\{ROUTES\.CATALOG\}[\s\S]*Download PDF[\s\S]*href=\{MAPSITE_APP_PATH\}[\s\S]*ROUTES\.ADMIN_DASHBOARD/,
    );
    expect(shell).toContain("ROUTES.CATALOG");
    expect(shell).toMatch(/\n\s*Product\n/);
    expect(shell).toMatch(/\n\s*Markets\n/);
  });

  it("sizes the sample toolbar as a matched button set", () => {
    expect(shell).toContain("talisbooks-viewer__header-actions--matched");
  });

  it("keeps PlaybackRail beside the restored header and omits the left brand rail", () => {
    expect(shell).toContain("const showViewerSidebar = false");
    expect(shell).not.toContain("TalisBooksViewerBrandRail");
    expect(shell).toContain("TalisBooksViewerPlaybackRail");
    expect(shell).toContain("talisbooks-viewer__header");
    const rails = readSource("components/talisbooks/viewer/TalisBooksViewerRails.tsx");
    expect(rails).not.toContain("talisbooks-viewer__map-pin");
    expect(rails).not.toContain("talisbooks-viewer__rail--left");
  });


  it("offers a mobile Landscape stage toggle with an easy return to Portrait", () => {
    expect(shell).toContain("stageLandscape");
    expect(shell).toContain("talisbooks-viewer--stage-landscape");
    expect(shell).toContain("talisbooks-viewer__orient-fab");
    expect(shell).toMatch(/Landscape|Portrait/);
    const rails = readSource("components/talisbooks/viewer/TalisBooksViewerRails.tsx");
    expect(rails).toContain("onToggleStageLandscape");
    expect(rails).toContain("talisbooks-viewer__rail-btn--orient");
    const css = readSource("app/globals.css");
    expect(css).toContain("talisbooks-viewer--stage-landscape");
    expect(css).toContain("rotate(90deg)");
    // Title/Back header must collapse in forced landscape so the stage is unobstructed.
    expect(css).toMatch(
      /\.talisbooks-viewer--stage-landscape \.talisbooks-viewer__header\s*\{[\s\S]*?display:\s*none/,
    );
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
    expect(viewerPage).not.toContain(
      "const canLiveEdit = isAdmin || (!isDemoBook && paymentReceived",
    );
  });

  it("opens ebook icons in the same tab", () => {
    expect(homeMap).toContain("href={ROUTES.CATALOG}");
    expect(homeMap).toContain('aria-label="View catalogue"');
    expect(homeMap).not.toContain('target="_blank"');
    expect(homeMap).not.toContain("noopener");
    expect(startPage).not.toContain('target="_blank"');
    expect(startPage).not.toContain("noopener");
    expect(startPage).not.toMatch(/new tab/i);
    expect(standingBook).not.toContain('target="_blank"');
    expect(standingBook).not.toContain("noopener");
    expect(standingBook).not.toMatch(/new tab/i);
  });

  it("shows the real cover image only — no PINNED / title overlay on shelf books", () => {
    expect(standingBook).toContain("talisbooks-standing-book__cover-image");
    expect(standingBook).toContain("talisbooks-standing-book__delete");
    expect(standingBook).not.toContain("talisbooks-standing-book__cover-scrim");
    expect(standingBook).not.toContain("talisbooks-standing-book__cover-copy");
    expect(standingBook).not.toContain("talisbooks-standing-book__cover-kicker");
    expect(standingBook).not.toContain(">Pinned<");
    expect(standingBook).not.toContain("cover-title");
    expect(standingBook).not.toContain("cover-subtitle");
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

  it("routes isolated / ALLPINS shelf Back to listings/allpins, not admin123", () => {
    expect(
      viewerMapsiteFastCode({
        fastCode: "admin123",
        isolatedBookshelf: true,
      }),
    ).toBe("allpins");
    expect(
      viewerBackToMapsiteHref({
        fastCode: "admin123",
        isolatedBookshelf: true,
      }),
    ).toBe("/talispros/mapsite/listings/allpins");
    expect(
      viewerMapsiteHref({
        fastCode: "ADMIN123",
        accountType: "root",
        isolatedBookshelf: true,
      }),
    ).toBe("/talispros/mapsite/listings/allpins");

    // Normal FAST books keep their own listings code.
    expect(
      viewerBackToMapsiteHref({ fastCode: "rm22", isolatedBookshelf: false }),
    ).toBe("/talispros/mapsite/listings/rm22");
    expect(
      viewerBackToMapsiteHref({ fastCode: "lg01" }),
    ).toBe("/talispros/mapsite/listings/lg01");

    const shellSrc = readSource(
      "components/talisbooks/viewer/TalisBooksViewerShell.tsx",
    );
    expect(shellSrc).toContain("viewerBackToMapsiteHref(book)");
    expect(shellSrc).not.toContain(
      "mapsiteBackFromScheduleHref(book.fastCode)",
    );
  });
});
