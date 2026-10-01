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
});
