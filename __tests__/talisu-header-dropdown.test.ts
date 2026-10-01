import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TALISU_MKTS_HEADER_DROPDOWN,
  TALISU_MKTS_HEADER_NAV,
} from "../lib/talisu/markets-pins";

describe("TalisU blue header dropdown", () => {
  it("exposes Knowledge Base, Audio Files, and Video entries", () => {
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.label)).toEqual([
      "Knowledge Base",
      "Audio Files",
      "Video",
    ]);
    expect(TALISU_MKTS_HEADER_DROPDOWN.map((i) => i.href)).toEqual([
      "/talisu/kb",
      "/talisu/au",
      "/talisu/video",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.map((i) => i.label)).toEqual([
      "Markets",
      "Register",
    ]);
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "E-Book")).toBe(
      false,
    );
    expect(TALISU_MKTS_HEADER_NAV.some((i) => i.label === "Audio")).toBe(false);
  });

  it("wires the blue header to render a TalisU dropdown menu", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TALISU_MKTS_HEADER_DROPDOWN");
    expect(header).toContain('aria-haspopup="menu"');
    expect(header).toMatch(/\n\s*TalisU\n/);
    expect(header).toContain('role="menu"');
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
    // Global `* { max-width:100% }` would otherwise squeeze the absolute card
    // to the TalisU trigger width (~86px) — cancel it and keep a PayPal-wide card.
    expect(header).toContain("max-w-none!");
    expect(header).toContain("min-w-[280px]");
    expect(header).toContain("w-80!");
  });
});
