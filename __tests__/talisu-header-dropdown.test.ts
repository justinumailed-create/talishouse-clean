import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_MAPSITES_LABEL,
  TALISU_MKTS_HEADER_REGISTER_DROPDOWN,
} from "../lib/talisu/markets-pins";

describe("TalisU blue header dropdown", () => {
  it("exposes FAQ first, then Knowledge Base, Audio, and Video", () => {
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label)).toEqual([
      "FAQ",
      "Knowledge Base",
      "Audio",
      "Video",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.href)).toEqual([
      "/talisu#faq",
      "/talisu/kb",
      "/talisu/au",
      "/talisu/video",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN[0]?.label).toBe("FAQ");
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.label)).toEqual([
      "Markets",
      "Bookshelf",
      "Register",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.href)).toEqual([
      "/talisu/mkts",
      "/catalogue/bookshelf",
      "/talisu/reg",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "All Books")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "FAST Shelves")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Create Demo")).toBe(false);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Admin Places")).toBe(false);
    expect(TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((i) => i.label)).toEqual([
      "Mapsite",
      "Product",
    ]);
    expect(TALISU_MKTS_HEADER_REGISTER_DROPDOWN.map((i) => i.href)).toEqual([
      "/talisu/reg",
      "/catalogue",
    ]);
  });


  it("renders a Mapsites FAST Code™ gate (no public claimed list) before the TalisU rule", () => {
    expect(TALISU_MKTS_HEADER_MAPSITES_LABEL).toBe("Mapsites");
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("MapsitesNavDropdown");
    const dropdown = readFileSync(
      resolve("components/talisu/MapsitesNavDropdown.tsx"),
      "utf8",
    );
    expect(dropdown).not.toContain("Claimed Mapsites");
    expect(dropdown).toContain("FAST Code");
    expect(dropdown).toContain("openClaimedMapSiteFromHomeFastCode");
    expect(dropdown).toContain("Demo Mapsite");
    expect(dropdown).toContain("DEMO_MAPSITE_BUILD_PATH");
    expect(dropdown).toContain("rounded-2xl");
    expect(dropdown).toContain("bg-white");
    const api = readFileSync(
      resolve("app/api/talisu/nav-mapsites/route.ts"),
      "utf8",
    );
    expect(api).toContain("listNavMapSites");
    const navLib = readFileSync(
      resolve("lib/talisu/nav-mapsites.ts"),
      "utf8",
    );
    expect(navLib).toContain("claimed: []");
  });

  it("puts a horizontal divider after FAQ in the TalisU dropdown", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain('item.label === "FAQ"');
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
    expect(header).toMatch(/\n\s*TalisU\n/);
    expect(header).toContain('role="menu"');
    // TalisU trigger is rendered after primary nav + Mapsites + vertical separator
    expect(header).toContain("TALISU_MKTS_HEADER_NAV.filter");
    expect(header).toContain("MapsitesNavDropdown");
    expect(header).toContain("RegisterNavDropdown");
    expect(header).toContain("bg-white/45");
    const marketsIdx = header.indexOf('item.label === "Markets"');
    const mapsitesIdx = header.indexOf("<MapsitesNavDropdown");
    const bookshelvesIdx = header.indexOf('item.label === "Bookshelf"');
    const registerFilterIdx = header.indexOf("<RegisterNavDropdown");
    const separatorIdx = header.indexOf("bg-white/45");
    const talisUIdx = header.indexOf("\n              TalisU\n");
    expect(marketsIdx).toBeGreaterThan(-1);
    expect(mapsitesIdx).toBeGreaterThan(marketsIdx);
    expect(bookshelvesIdx).toBeGreaterThan(mapsitesIdx);
    expect(registerFilterIdx).toBeGreaterThan(bookshelvesIdx);
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
});
