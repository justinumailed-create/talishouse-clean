import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { ASSISTANT_PERSONAS } from "../lib/talispros/assistant-personas";
import { isPoweredByBanner } from "../lib/talispros/hide-elevenlabs-banner";

const read = (path: string) => readFileSync(resolve(path), "utf8");

const EN_GREETING =
  "Hi, I'm Aisha. I can help make your advertising revenue producing";
const DE_GREETING =
  "Hallo, ich bin Aisha. Ich helfe Ihnen, Ihre Werbung umsatzwirksam zu machen";

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
    expect(widget).toContain('placement = "bottom-left"');
    expect(widget).toContain("startAishaConversation");
    expect(widget).toContain("data-start-label={copy.startCall}");
    expect(widget).toContain("shadowRoot");
    expect(widget).toContain("watchPoweredByBanner");
    expect(read("lib/talispros/hide-elevenlabs-banner.ts")).toContain("elevenlabs.io");
    const embeds: string[] = [];
    const walk = (path: string) => {
      for (const entry of readdirSync(path)) {
        const full = join(path, entry);
        if (statSync(full).isDirectory()) {
          if (entry === "node_modules" || entry === ".next") continue;
          walk(full);
          continue;
        }
        if (!/\.(tsx|jsx)$/.test(entry)) continue;
        if (read(full).includes("<elevenlabs-convai")) embeds.push(full);
      }
    };
    for (const dir of ["components", "app", "lib"]) walk(dir);
    expect(embeds).toEqual(["components/talispros/AishaConvaiWidget.tsx"]);
    const css = read("app/globals.css");
    expect(css).toMatch(
      /\.aisha-convai-slot elevenlabs-convai\s*\{[^}]*pointer-events:\s*none\s*!important/,
    );
    expect(css).not.toMatch(
      /\.aisha-convai-slot elevenlabs-convai\s*\{[^}]*pointer-events:\s*auto/,
    );
    expect(widget).not.toMatch(/api[_-]?key|xi-api-key|ELEVENLABS_API_KEY/i);
    expect(widget).not.toMatch(/talispros\.com/);
    expect(shell).not.toContain('<TalisBotChat position="left" />');
    expect(read("types/elevenlabs-convai.d.ts")).toContain('"elevenlabs-convai"');
  });

  it("hides only the Powered by line", () => {
    expect(isPoweredByBanner("Powered by ElevenAgents")).toBe(true);
    expect(isPoweredByBanner("  Powered by   ElevenAgents ")).toBe(true);
    expect(isPoweredByBanner("By clicking Agree, I consent to the ElevenLabs terms.")).toBe(false);
    expect(isPoweredByBanner("Start a call")).toBe(false);
  });

  it("uses the exact greeting in English and German", () => {
    expect(en.home.assistants.aisha.greeting).toBe(EN_GREETING);
    expect(de.home.assistants.aisha.greeting).toBe(DE_GREETING);
    expect(en.home.assistants.aisha.label).toBe(EN_GREETING);
    expect(de.home.assistants.aisha.label).toBe(DE_GREETING);
    expect(en.home.assistants.aisha.greeting).not.toMatch(/talispros|—/);
    expect(de.home.assistants.aisha.greeting).not.toMatch(/talispros|—/);
  });
});
