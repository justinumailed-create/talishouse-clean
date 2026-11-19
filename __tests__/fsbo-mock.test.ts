import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { indexablePageRoutes } from "../lib/seo/indexable-routes";
import { FSBO_INTAKE_PATH, FSBO_SAMPLE_PATH } from "../lib/fsbo/mock-paths";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("FSBO listing mockup", () => {
  it("stays out of the navbar and the sitemap", () => {
    const header = read("components/talisu/TalisUMktsHeader.tsx");
    expect(read("components/RootShell.tsx")).toContain('pathname === "/fsbo"');
    expect(header).not.toContain(FSBO_INTAKE_PATH);
    expect(header).not.toContain(FSBO_SAMPLE_PATH);
    expect(indexablePageRoutes()).not.toContain(FSBO_INTAKE_PATH);
    expect(indexablePageRoutes()).not.toContain(FSBO_SAMPLE_PATH);
    expect(read("app/fsbo/page.tsx")).toContain("index: false");
    expect(read("app/fsbo/sample/page.tsx")).toContain("index: false");
  });

  it("confirms on the page and does not start a call", () => {
    const form = read("components/fsbo/FsboIntakeForm.tsx");
    const sample = read("components/fsbo/FsboSampleListing.tsx");
    expect(form).toContain("data-testid=\"fsbo-confirmation\"");
    expect(form).not.toContain("fetch(");
    expect(form).toContain("Example pricing");
    expect(sample).toContain("Voice pitch preview");
    expect(sample).not.toContain("elevenlabs");
    expect(sample).not.toContain("useConversation");
    expect(`${form} ${sample}`).not.toMatch(/[—–]/);
  });
});
