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
    expect(shell).not.toContain("TalisBooksViewerLiveEditor");
    expect(shell).not.toContain("showViewerSidebar");
    expect(shell).not.toContain("TalisBooksViewerBrandRail");
    expect(shell).toContain("TalisBooksViewerPlaybackRail");
    expect(shell).toContain("talisbooks-viewer__header");
    expect(shell).not.toContain("TalisBooksViewerControls");
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

  it("removes the bottom playback dock while retaining stage navigation", () => {
    expect(shell).not.toContain("TalisBooksViewerControls");
    expect(shell).toContain("TalisBooksViewerStage");
    const css = readSource("app/globals.css");
    expect(css).toContain("formerly used by the bottom controls");
    expect(css).not.toContain("--viewer-book-height");
  });

  it("fills the viewport under the navbar and contain-fits spreads", () => {
    const layout = readSource(
      "components/talisbooks/platform/TalisBooksLayoutClient.tsx",
    );
    // Navbar + flex-1 slot inside a 100dvh column: no hard-coded navbar height.
    expect(layout).toContain("flex h-dvh min-h-dvh flex-col");
    expect(layout).toContain('<div className="min-h-0 flex-1">{children}</div>');

    const css = readSource("app/globals.css");
    const block = (selector: string) => {
      const start = css.indexOf(`\n${selector} {`);
      expect(start).toBeGreaterThan(-1);
      return css.slice(start, css.indexOf("\n}", start));
    };
    const viewer = block(".talisbooks-viewer");
    expect(viewer).toMatch(/height:\s*100%/);
    expect(viewer).toMatch(/padding:\s*0;/);
    // Stage column + perspective box are size containers.
    expect(block(".talisbooks-viewer__stage-column")).toContain("container-type: size");
    const perspective = block(".talisbooks-viewer-stage__perspective");
    expect(perspective).toContain("container-type: size");
    expect(perspective).not.toContain("aspect-ratio");
    // Contain-fit: limited by width or height, aspect preserved.
    const book = block(".talisbooks-viewer-book");
    expect(book).toContain(
      "width: min(100cqw, calc(100cqh * var(--book-spread-aspect)));",
    );
    expect(book).toContain("aspect-ratio: var(--book-spread-aspect);");
    expect(book).not.toMatch(/max-height:\s*100%/);
    expect(block(".talisbooks-viewer-book--single")).toContain(
      "width: min(100cqw, calc(100cqh * var(--book-spread-aspect, 16 / 9) / 2));",
    );
    // No padded, rounded card around the reader.
    const desk = block(".talisbooks-viewer-stage__desk");
    expect(desk).toContain("border-radius: 0;");
    expect(desk).toContain("background: transparent;");
    // Arrows reach into the desktop gutters (escape the global max-width).
    const nav = block(".talisbooks-viewer-stage__nav");
    expect(nav).toContain("inset: 0 calc(-1 * var(--viewer-gutter));");
    expect(nav).toContain("max-width: none;");
    // Rotated mobile stage swaps the stage column's real box.
    expect(css).toMatch(
      /\.talisbooks-viewer--stage-landscape \.talisbooks-viewer-stage \{[\s\S]*?width:\s*100cqh;[\s\S]*?height:\s*100cqw;/,
    );
  });

  it("keeps the playback rail inside the stage column and the header compact", () => {
    const railIndex = shell.indexOf("<TalisBooksViewerPlaybackRail");
    expect(shell.indexOf('className="talisbooks-viewer__stage-column"')).toBeLessThan(
      railIndex,
    );
    expect(shell).toContain('className="talisbooks-viewer__heading"');
    // Title metadata is still rendered.
    expect(shell).toContain("talisbooks-viewer__eyebrow");
    expect(shell).toContain("talisbooks-viewer__title");
    expect(shell).toContain("talisbooks-viewer__subtitle");
  });

  it("shows Register only on issued FAST ebooks; Claim on demo viewers", () => {
    expect(shell).toContain("TALISBOOKS_SAMCART_REGISTER_URL");
    expect(shell).toContain("Continue to register");
    expect(shell).toContain("talisbooks-viewer__register");
    expect(shell).toContain("talisBooksViewerCta");
    expect(shell).toContain("DemoClaimMarketButton");
    expect(shell).toContain("talisbooks-viewer__claim");
    const css = readSource("app/globals.css");
    expect(css).toMatch(
      /\.talisbooks-viewer__register[\s\S]*position:\s*absolute[\s\S]*bottom:/,
    );
    expect(css).toContain("talisbooks-viewer__claim");
    expect(css).toContain("--talis-nav-blue");
    expect(css).toMatch(
      /\.talisbooks-viewer__register[\s\S]*background:\s*var\(--talis-nav-blue\)/,
    );
  });

  it("omits Live Edit from every viewer surface", () => {
    expect(shell).not.toContain("TalisBooksViewerLiveEditor");
    expect(shell).not.toContain("canLiveEdit");
    expect(shell).not.toContain("talisbooks-viewer-live-edit");
    const viewerPage = readSource("app/talisbooks/viewer/[slug]/page.tsx");
    expect(viewerPage).not.toContain("canLiveEdit");
    expect(viewerPage).not.toContain("TalisBooksViewerLiveEditor");
    expect(viewerPage).not.toContain("pageInsertLocked");
    const css = readSource("app/globals.css");
    expect(css).not.toContain("talisbooks-viewer-live-edit");
  });

  it("mounts the blue TalisU navbar above the viewer", () => {
    const layout = readSource(
      "components/talisbooks/platform/TalisBooksLayoutClient.tsx",
    );
    expect(layout).toContain("TalisUMktsHeader");
    expect(layout).toContain('pathname.startsWith("/talisbooks/viewer")');
    expect(layout).not.toContain("isDashboard || isLibrary || isEditor || isViewer");
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
    ).toBe("/talisu/mkts");
    expect(
      viewerMapsiteHref({
        fastCode: "ADMIN123",
        accountType: "root",
        isolatedBookshelf: true,
      }),
    ).toBe("/talisu/mkts");

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
