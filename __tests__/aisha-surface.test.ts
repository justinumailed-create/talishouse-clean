import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha bubble while the widget panel is open", () => {
  it("hides the write-up and keeps the widget panels above it", () => {
    const widget = read("components/talispros/AishaConvaiWidget.tsx");
    const css = read("app/globals.css");
    const banner = read("lib/talispros/hide-elevenlabs-banner.ts");
    expect(widget).toContain('data-surface={surfaceOpen ? "open" : "idle"}');
    expect(widget).toContain("watchPoweredByBanner(slot, setSurfaceOpen)");
    expect(css).toContain('[data-surface="open"] .aisha-convai-label');
    expect(css).toContain("rgba(255, 255, 255, 0.94)");
    expect(css).toContain("-webkit-backdrop-filter");
    expect(banner).toContain("function convaiSurfaceOpen");
    expect(banner).toContain(".terms");
    expect(banner).not.toContain("attributes: true");
    expect(widget).toContain("setBubbleDismissed(true)");
    expect(widget).toContain("aisha-convai-dismiss");
    expect(widget).not.toContain("sessionStorage");
    expect(widget).not.toContain("localStorage");
    expect(css).toContain("--aisha-panel-top");
    expect(banner).toContain('[data-variant="expanded"].sheet');
  });
});
