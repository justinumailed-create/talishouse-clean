import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Talispros™ static brand mark (no flip)", () => {
  it("wires static Talispros™ into blue TalisUMktsHeader (no TalisU flip)", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain("TalisBrandMark");
    expect(header).not.toContain("TalisBrandFlip");
    expect(header).toContain("TALISU_MKTS_HEADER_TAGLINE");

    const mark = readFileSync(
      resolve("components/talisu/TalisBrandMark.tsx"),
      "utf8",
    );
    expect(mark).toContain("Talispros™");
    expect(mark).not.toContain("TalisU™");
    expect(mark).not.toContain("setInterval");
    expect(mark).not.toContain("setTimeout");
  });

  it("points blue-bar logo mark at homepage / (not /talisu)", () => {
    const header = readFileSync(
      resolve("components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(header).toContain('href="/" className="shrink-0 self-start"');
    expect(header).not.toContain('href="/talisu" className="shrink-0 self-start"');
    expect(header).toContain("font-sans");
    const mark = readFileSync(
      resolve("components/talisu/TalisBrandMark.tsx"),
      "utf8",
    );
    expect(mark).toContain('href="/"');
  });

});
