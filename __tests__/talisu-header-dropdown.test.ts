import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER,
  TALISU_MKTS_HEADER_LOGO_HREF,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_MAPSITES_LABEL,
  TALISU_MKTS_HEADER_REGISTER_DROPDOWN,
} from "../lib/talisu/markets-pins";

describe("TalisU blue header dropdown", () => {
  it("exposes Bookshelf, FAQ, Media Directory | Contract, Knowledge Base (no Audio / Video)", () => {
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label)).toEqual([
      "Bookshelf",
      "FAQ",
      "Media Directory",
      "Contract",
      "Knowledge Base",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.href)).toEqual([
      "/catalogue/bookshelf",
      "/talisu#faq",
      "/talisu/media-directory",
      "/talisu/contract",
      "/talisu/kb",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER).toBe("Media Directory");
    const labels = TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label as string);
    expect(labels).not.toContain("Audio");
    expect(labels).not.toContain("Video");
    const header = readFileSync(resolve("components/talisu/TalisUMktsHeader.tsx"), "utf8");
    expect(header).not.toContain("t.nav.talisuMenu.audio");
    expect(header).not.toContain("t.nav.talisuMenu.video");
    // Talispros™ moved out of the dropdown: the header logo opens that page.
    expect(TALISU_MKTS_HEADER_DROPDOWN.some((i) => (i.label as string) === "Talispros")).toBe(false);
    expect(
      TALISU_MKTS_HEADER_DROPDOWN.some((i) => (i.href as string) === TALISU_MKTS_HEADER_LOGO_HREF),
    ).toBe(false);
    // Bookshelf sits ahead of FAQ inside TalisU (moved out of the top level).
    expect(TALISU_MKTS_HEADER_DROPDOWN[0]?.label).toBe("Bookshelf");
    expect(TALISU_MKTS_HEADER_DROPDOWN[1]?.label).toBe("FAQ");
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.label)).toEqual([
      "Home",
      "Markets",
      "Catalogue",
      "Register",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.href)).toEqual([
      "/",
      "/talisu/mkts",
      "/catalogue",
      "/talisu/reg",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Bookshelf")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "All Books")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "FAST Shelves")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Create Demo")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Admin Places")).toBe(false);
    expect(TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((i) => i.label)).toEqual([
      "Mapsite",
      "Product Options",
    ]);
    expect(TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((i) => i.href)).toEqual([
      "/talisu/reg",
      "/talisu/engage",
    ]);
  });


  it("links Mapsites straight to the Demo Mapsite page, which hosts the FAST Code™ card", () => {
    expect(TALISU_MKTS_HEADER_MAPSITES_LABEL).toBe("Mapsites");
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).not.toContain("MapsitesNavDropdown");
    expect(header).toContain("DEMO_MAPSITE_BUILD_PATH");
    expect(header).toContain('data-testid="nav-mapsites-link"');
    const card = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoFastCodeCard.tsx"),
      "utf8",
    );
    expect(card).toContain("openClaimedMapSiteFromHomeFastCode");
    expect(card).toContain('href="/talisu/reg"');
    const builder = readFileSync(
      resolve("components/talispros/demo-mapsite/DemoMapSiteBuilderClient.tsx"),
      "utf8",
    );
    // Ralf (Oct 17): the big "Open your Mapsite" FAST Code block is gone from the
    // Mapsites page (Sign In is item one on the home page); beige working page.
    expect(builder).not.toContain("<DemoFastCodeCard");
    // Oct 18: beige Catalogue shell (WorkingPageShell); the bottom
    // "Register a Mapsite" CTA is gone.
    expect(builder).toContain("<WorkingPageShell");
    expect(builder).not.toContain("ROUTES.TALISU_REGISTER");
  });

  it("puts a horizontal divider after Media Directory (Contract + Knowledge Base below) on desktop and mobile", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).not.toContain('item.label === "Knowledge Base"');
    // Desktop dropdown + mobile menu both split after Media Directory.
    expect(header.split("item.label === TALISU_MKTS_HEADER_DROPDOWN_DIVIDER_AFTER").length).toBe(3);
    expect(header).toContain('data-testid="mobile-talisu-divider"');
    expect(header).toContain('case "Bookshelf":');
    expect(header).toContain("t.nav.bookshelf");
    expect(header).toContain('role="separator"');
    expect(header).toContain("border-t border-white/25");
  });

  it("wires the blue header to render a TalisU dropdown as the last nav item", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TALISU_MKTS_HEADER_DROPDOWN");
    expect(header).toContain('aria-haspopup="menu"');
    expect(header).toMatch(/\n\s*\{t\.nav\.talisu\}\n/);
    expect(header).toContain('role="menu"');
    // TalisU trigger is rendered after primary nav + Mapsites + vertical separator
    expect(header).toContain("TALISU_MKTS_HEADER_NAV.filter");
    expect(header).toContain("RegisterNavDropdown");
    expect(header).toContain("bg-white/45");
    const marketsIdx = header.indexOf('item.label === "Markets"');
    const mapsitesIdx = header.indexOf('data-testid="nav-mapsites-link"');
    const catalogueIdx = header.indexOf('(item) => item.label === "Catalogue"');
    const registerFilterIdx = header.indexOf("<RegisterNavDropdown");
    const separatorIdx = header.indexOf("bg-white/45");
    const talisUIdx = header.indexOf("\n              {t.nav.talisu}\n");
    expect(marketsIdx).toBeGreaterThan(-1);
    const homeIdx = header.indexOf('item.label === "Home").map');
    expect(homeIdx).toBeGreaterThan(-1);
    expect(marketsIdx).toBeGreaterThan(homeIdx);
    // Home, Markets, Mapsites, Catalogue, Register | TalisU (Bookshelf, FAQ, …)
    expect(header).not.toContain('(item) => item.label === "Bookshelf"');
    expect(mapsitesIdx).toBeGreaterThan(marketsIdx);
    expect(catalogueIdx).toBeGreaterThan(mapsitesIdx);
    expect(registerFilterIdx).toBeGreaterThan(catalogueIdx);
    expect(separatorIdx).toBeGreaterThan(registerFilterIdx);
    expect(talisUIdx).toBeGreaterThan(separatorIdx);
  });

  it("opens Knowledge Base unlock as a navbar drop-pop (not a full page)", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TalisUKbUnlockForm");
    expect(header).toContain("kb-unlock");
    expect(header).toContain("handleKbMenuClick");
    expect(header).toContain("TALISU_KB_OPEN_UNLOCK_EVENT");
    expect(header).not.toContain("TALISU_KB_UNLOCK_QUERY");
    expect(header).toContain("bg-white p-5");
    expect(header).toContain("max-w-none!");
    expect(header).toContain("min-w-[280px]");
    expect(header).toContain("w-80!");
  });

  it("makes the tree icon, Talispros™ and the tagline one logo link to the Talispros™ page", () => {
    expect(TALISU_MKTS_HEADER_LOGO_HREF).toBe("/talisu/talispros");
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    const start = header.indexOf('data-testid="header-logo-link"');
    expect(start).toBeGreaterThan(-1);
    const linkOpen = header.lastIndexOf("<Link", start);
    const linkClose = header.indexOf("</Link>", start);
    const logo = header.slice(linkOpen, linkClose);
    expect(logo).toContain("href={TALISU_MKTS_HEADER_LOGO_HREF}");
    expect(logo).toContain("cursor-pointer");
    expect(logo).toContain("select-none");
    expect(logo).toContain("talisu-mark.png");
    expect(logo).toContain("<TalisBrandMark tagline={t.nav.tagline} />");
    // Exactly one header logo link; no separate icon link to "/".
    expect(header.split('data-testid="header-logo-link"').length).toBe(2);
    expect(header).not.toContain('href="/" className="shrink-0 self-start"');
    expect(header).not.toContain("t.nav.talisuMenu.talispros");
    // Home stays a navbar link.
    expect(header).toContain('item.label === "Home").map');
    const mark = readFileSync(
      resolve("components/talisu/TalisBrandMark.tsx"),
      "utf8",
    );
    // Wordmark + tagline sit inside the logo link: no nested link.
    expect(mark).not.toContain("<Link");
    expect(mark).not.toContain("<a ");
    expect(mark).toContain("Talispros™");
    expect(mark).toContain("{tagline}");
  });
});
