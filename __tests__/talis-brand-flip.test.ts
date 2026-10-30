import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { TALISU_MKTS_HEADER_TAGLINE } from "../lib/talisu/markets-pins";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Tsplits™ static brand mark (no flip)", () => {
  it("wires static Tsplits™ into blue TalisUMktsHeader (no TalisU flip)", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TalisBrandMark");
    expect(header).not.toContain("TalisBrandFlip");
    expect(header).toContain("t.nav.tagline");
    expect(en.nav.tagline).toBe(TALISU_MKTS_HEADER_TAGLINE);

    const mark = readFileSync(
      resolve("components/talisu/TalisBrandMark.tsx"),
      "utf8",
    );
    expect(mark).toContain("Tsplits™");
    expect(mark).not.toContain("TalisU™");
    expect(mark).not.toContain("setInterval");
    expect(mark).not.toContain("setTimeout");
  });

  it("points the blue-bar logo (icon + wordmark + tagline) at the Tsplits™ page", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("href={TALISU_MKTS_HEADER_LOGO_HREF}");
    expect(header).not.toContain('href="/" className="shrink-0 self-start"');
    expect(header).not.toContain('href="/talisu" className="shrink-0 self-start"');
    expect(header).toContain("font-sans");
    const mark = readFileSync(
      resolve("components/talisu/TalisBrandMark.tsx"),
      "utf8",
    );
    expect(mark).not.toContain("<Link");
  });

});
