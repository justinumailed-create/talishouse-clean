import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha Convai widget on the homepage", () => {
  it("loads the public embed after the page is interactive, with no key", () => {
    const widget = read("components/talispros/AishaConvaiWidget.tsx");
    const page = read("components/talispros/TalisprosGatePage.tsx");
    expect(page).toContain("<AishaConvaiWidget");
    expect(widget).toContain('agent-id={AGENT_ID}');
    expect(widget).toContain("agent_0401m7cxgba1fhwb35aqr43acnv1");
    expect(widget).toContain("https://unpkg.com/@elevenlabs/convai-widget-embed");
    expect(widget).toContain('strategy="lazyOnload"');
    expect(widget).not.toMatch(/api[_-]?key|xi-api-key|ELEVENLABS_API_KEY/i);
    expect(widget).not.toMatch(/talispros\.com/);
    expect(read("types/elevenlabs-convai.d.ts")).toContain('"elevenlabs-convai"');
  });

  it("names Aisha in English and German without an em dash", () => {
    expect(en.home.aisha.label).toBe("Aisha, Tsplits™ team leader");
    expect(de.home.aisha.label).toBe("Aisha, Teamleiterin von Tsplits™");
    expect(en.home.aisha.action).not.toMatch(/talispros|—/);
    expect(de.home.aisha.action).not.toMatch(/talispros|—/);
    expect(de.home.aisha.startCall).not.toBe(en.home.aisha.startCall);
  });
});
