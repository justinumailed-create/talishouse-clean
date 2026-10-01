import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
} from "../lib/talisu/markets-pins";

describe("TalisU blue header dropdown", () => {
  it("exposes Knowledge Base, Audio, and Video entries", () => {
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label)).toEqual([
      "Knowledge Base",
      "Audio",
      "Video",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.href)).toEqual([
      "/talisu/kb",
      "/talisu/au",
      "/talisu/video",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.label)).toEqual([
      "Markets",
      "Common Shelf",
      "All Books",
      "FAST Shelves",
      "Create Demo",
      "Admin Places",
      "Register",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.href)).toEqual([
      "/talisu/mkts",
      "/catalogue/bookshelf",
      "/talisbooks",
      "/talisbooks/library",
      "/catalogue/bookshelf/create",
      "/admin/talisbooks/bookshelves",
      "/talisu/reg",
    ]);
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
    // TalisU trigger is rendered after primary nav items + vertical separator
    expect(header).toContain("TALISU_MKTS_HEADER_NAV.map");
    expect(header).toContain("bg-white/45");
    const navRenderIdx = header.indexOf("{TALISU_MKTS_HEADER_NAV.map((item) => renderNavLink(item))}");
    const separatorIdx = header.indexOf('bg-white/45');
    const menuButtonIdx = header.indexOf('aria-haspopup="menu"');
    expect(navRenderIdx).toBeGreaterThan(-1);
    expect(separatorIdx).toBeGreaterThan(navRenderIdx);
    expect(menuButtonIdx).toBeGreaterThan(separatorIdx);
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
