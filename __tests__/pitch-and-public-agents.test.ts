import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import { markPitchDone, readPitchDone } from "../lib/talispros/pitch-gate";
import { publicAgentFollowUp } from "../lib/talisu/checkout-codes";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("first-time pitch and public agent codes", () => {
  it("remembers a finished pitch on this device and skips signed-in visitors", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    expect(readPitchDone(storage)).toBe(false);
    markPitchDone(storage);
    expect(readPitchDone(storage)).toBe(true);
    const page = read("components/talispros/TalisprosGatePage.tsx");
    expect(page).toContain("HomePitchLock");
    expect(page).toContain("MAPSITE_OWNER_COOKIE");
    expect(page).toContain("pitchExempt");
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain('href="/register"');
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain('data-testid="home-pitch-start"');
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain("websterHref");
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain("t.home.assistants.webster.startCall");
    expect(page).toContain("websterOneHref");
    expect(page).toContain("HOMEPAGE_AISHA_WIDGET");
    expect(read("lib/talispros/homepage-aisha-widget.ts")).toContain("HOMEPAGE_AISHA_WIDGET: boolean = false");
    expect(read("app/webster/page.tsx")).toContain("recordsPitch");
    expect(read("app/webster/project/page.tsx")).toContain("recordsPitch");
    expect(read("app/home/[fastCode]/page.tsx")).toContain("<MapsiteAisha");
    expect(read("components/talispros/personal-home/PersonalHomeEditor.tsx")).toContain("bottom-56");
    expect(en.home.pitch.registered).toBe("I've already registered");
    expect(de.home.pitch.registered).toBe("Ich bin bereits registriert");
    expect(`${en.home.pitch.note} ${de.home.pitch.note}`).not.toMatch(/[—–]/);
  });

  it("maps Websterr to Ralf and Aishaa to Jonathan without an e-sign step", () => {
    expect(publicAgentFollowUp("Websterr")).toBe("Ralf");
    expect(publicAgentFollowUp("Aishaa")).toBe("Jonathan");
    const gate = read("lib/talispros/prospect-gate-server.ts");
    expect(gate).toContain("publicAgentGrantId");
    expect(gate).toContain("PUBLIC_AGENT_COOKIE");
    const checkout = read("components/talisu/RegisterProductCheckout.tsx");
    expect(checkout).not.toContain("enforcePmcRegistrationGate");
  });
});
