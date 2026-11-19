import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("homepage Aisha and Webster", () => {
  it("uses the short bubbles and opens the guide pages without a call", () => {
    expect(en.home.assistants.aisha.homeBubble).toBe(
      "New here? I'm Aisha. I can help make in-house advertising revenue producing. Ask me how.",
    );
    expect(de.home.assistants.aisha.homeBubble).toBe(
      "Neu hier? Ich bin Aisha. Ich kann helfen, hauseigene Werbung umsatzbringend zu machen. Fragen Sie mich, wie.",
    );
    expect(en.home.assistants.webster.projectIntro).toBe(
      "Considering a project? Talk to me. I'm Webster,\nyour free-of-charge Fulfilment Advisor.",
    );
    expect(de.home.assistants.webster.projectIntro).toBe(
      "Planen Sie ein Projekt? Sprechen Sie mit mir. Ich bin Webster,\nIhr kostenloser Fulfilment-Berater.",
    );
    const pair = read("components/talispros/HomeAgentPair.tsx");
    expect(pair).toContain('href="/aisha"');
    expect(pair).toContain('href="/webster/project"');
    expect(pair).toContain('callHref="/aisha?call=1"');
    expect(pair).toContain('callHref="/webster/project?call=1"');
    expect(pair).toContain("aisha.homeBubble");
    expect(pair).toContain("webster.projectIntro");
    expect(`${en.home.assistants.aisha.homeBubble} ${de.home.assistants.aisha.homeBubble}`).not.toMatch(
      /[—–]/,
    );
    const gate = read("components/talispros/TalisprosGatePage.tsx");
    expect(gate).not.toContain("readOwnerSessionFastCodes");
    expect(gate).not.toContain("AishaConvaiWidget");
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain("<HomeAgentPair");
    expect(read("components/talispros/TalisprosHomeShowcase.tsx")).not.toContain("HomeAgentPair");
    const aisha = read("app/aisha/page.tsx");
    expect(aisha).not.toContain("aisha-registrar-pitch");
    expect(aisha).not.toContain("intro=");
  });
});
