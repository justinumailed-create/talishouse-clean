import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ebook spread gutter", () => {
  const css = readFileSync("app/globals.css", "utf8");

  it("paints an 8px white strip on desktop two-page spreads without changing the book width", () => {
    expect(css).toContain("width: min(100cqw, calc(100cqh * var(--book-spread-aspect)));");
    expect(css).toMatch(/@media \(min-width: 1025px\) \{[\s\S]*\.talisbooks-viewer-book__gutter::after \{[\s\S]*width: 8px;[\s\S]*background: #ffffff;/);
    expect(css).toContain(".talisbooks-viewer-book__spread");
    expect(css).toContain("grid-template-columns: 1fr 1fr;");
  });
});
