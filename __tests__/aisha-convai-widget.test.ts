import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { ASSISTANT_PERSONAS } from "../lib/talispros/assistant-personas";

const read = (path: string) => readFileSync(resolve(path), "utf8");

const EN_GREETING =
  "Hello, I'm Aisha, Your T-Splits Mapsites and Fulfilment Team Leader. May I have your name?";
const DE_GREETING =
  "Hallo, ich bin Aisha, Ihre T-Splits Mapsites- und Fulfilment-Teamleiterin. Darf ich Ihren Namen erfahren?";

describe("Aisha Convai widget on the homepage", () => {
  it("loads the public embed after the page is interactive, with no key", () => {
    const widget = read("components/talispros/AishaConvaiWidget.tsx");
    const page = read("components/talispros/TalisprosGatePage.tsx");
    const shell = read("components/RootShell.tsx");
    expect(page).toContain("<AishaConvaiWidget");
    expect(widget).toContain("agent-id={persona.agentId}");
    expect(ASSISTANT_PERSONAS.aisha.agentId).toBe("agent_0401m7cxgba1fhwb35aqr43acnv1");
    expect(ASSISTANT_PERSONAS.aisha.portraitSrc).toBe("/images/mapsites/aisha-c.webp");
    expect(widget).toContain("https://unpkg.com/@elevenlabs/convai-widget-embed");
    expect(widget).toContain('strategy="lazyOnload"');
    expect(widget).toContain('placement="bottom-left"');
    expect(widget).not.toMatch(/api[_-]?key|xi-api-key|ELEVENLABS_API_KEY/i);
    expect(widget).not.toMatch(/talispros\.com/);
    expect(shell).not.toContain('<TalisBotChat position="left" />');
    expect(read("types/elevenlabs-convai.d.ts")).toContain('"elevenlabs-convai"');
  });

  it("uses the exact greeting in English and German", () => {
    expect(en.home.assistants.aisha.greeting).toBe(EN_GREETING);
    expect(de.home.assistants.aisha.greeting).toBe(DE_GREETING);
    expect(en.home.assistants.aisha.label).toBe(
      "Aisha, T-Splits Mapsites and Fulfilment Team Leader",
    );
    expect(de.home.assistants.aisha.label).toBe(
      "Aisha, T-Splits Mapsites- und Fulfilment-Teamleiterin",
    );
    expect(en.home.assistants.aisha.greeting).not.toMatch(/talispros|—/);
    expect(de.home.assistants.aisha.greeting).not.toMatch(/talispros|—/);
  });
});
