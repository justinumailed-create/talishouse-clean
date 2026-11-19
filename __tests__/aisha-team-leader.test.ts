import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import {
  AISHA_CALL_PATH,
  aishaSignInPath,
  safeAishaReturnPath,
} from "../lib/talispros/aisha-call-path";
import {
  AISHA_HOMEPAGE_AGENT_ID,
  AISHA_MAPSITE_AGENT_ID,
} from "../lib/talispros/aisha-mapsite-agent";
import {
  aishaAnonymousVariables,
  aishaOwnerVariables,
  aishaVariablesForAgent,
  serializeAishaVariables,
} from "../lib/talispros/aisha-owner-session";
import { transcriptParts } from "../lib/talispros/transcript-brand";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha team leader", () => {
  it("sends registered visitors through sign-in and offers Aisha to owners", () => {
    expect(aishaSignInPath()).toBe(
      "/talispros/client/login?next=%2Faisha%3Fcall%3D1",
    );
    expect(safeAishaReturnPath("/aisha?call=1")).toBe(AISHA_CALL_PATH);
    expect(safeAishaReturnPath("https://evil.example/aisha?call=1")).toBeNull();
    expect(safeAishaReturnPath("/aisha?code=dc06")).toBeNull();
    expect(safeAishaReturnPath("//tsplits.com")).toBeNull();
    const gate = read("components/talispros/TalisprosHomeGate.tsx");
    expect(gate).toContain('data-testid="home-talk-aisha"');
    expect(gate).toContain('data-testid="home-describe-project"');
    expect(gate).toContain("t.home.pitch.talkToAisha");
    expect(en.home.pitch.talkToAisha).toBe("Talk to Aisha, your team leader");
    expect(de.home.pitch.talkToAisha).toBe("Sprechen Sie mit Aisha, Ihrer Teamleiterin");
    expect(`${en.home.pitch.talkToAisha} ${de.home.pitch.talkToAisha}`).not.toMatch(/[—–]/);
    expect(read("app/aisha/page.tsx")).toContain("loadAishaCallVariables()");
    expect(read("app/aisha/page.tsx")).not.toContain("query.code");
    expect(read("app/aisha/page.tsx")).toContain("ASSISTANT_PERSONAS.aisha");
  });

  it("builds session variables and keeps anonymous callers empty", () => {
    const anon = aishaAnonymousVariables();
    expect(anon.signed_in).toBe("no");
    expect(anon.first_name).toBe("not signed in");
    expect(anon.fast_codes).toBe("");
    expect(anon.mapsite_urls).toBe("");
    expect(serializeAishaVariables(anon)).not.toMatch(/dc06|lrg/i);
    const owner = aishaOwnerVariables(
      [
        { fastCode: "dc06", firstName: "Doug", pinCount: 4, pinAllowance: 10 },
        { fastCode: "lrg1", firstName: "", pinCount: 1, pinAllowance: 1 },
      ],
      "https://tsplits.com",
    );
    expect(owner).toMatchObject({
      signed_in: "yes",
      first_name: "Doug",
      fast_codes: "dc06, lrg1",
      mapsite_urls: "https://tsplits.com/map/dc06, https://tsplits.com/map/lrg1",
      home_urls: "https://tsplits.com/home/dc06, https://tsplits.com/home/lrg1",
      pin_count: "5",
      pin_allowance: "11",
      bookshelf_urls:
        "https://tsplits.com/talisbooks/fast/dc06, https://tsplits.com/talisbooks/fast/lrg1",
      extra_pin_url: "https://tsplits.com/map/dc06#additional-pins",
    });
    expect(owner.pin_summary).toBe("dc06: 4 of 10; lrg1: 1 of 1");
    expect(
      aishaVariablesForAgent(
        AISHA_MAPSITE_AGENT_ID,
        "mapsite",
        "session",
      ),
    ).toBe("mapsite");
    expect(
      aishaVariablesForAgent(AISHA_HOMEPAGE_AGENT_ID, "mapsite", "session"),
    ).toBe("session");
    expect(AISHA_HOMEPAGE_AGENT_ID).toBe("agent_0401m7cxgba1fhwb35aqr43acnv1");
  });
});

describe("agent transcript brand", () => {
  it("links the website and marks the bare brand once", () => {
    const parts = transcriptParts(
      "Visit https://www.TSPLITS.com/register or TSPLITS.COM. Tsplits™ already has a mark. T-splits and tsplits do not.",
    );
    expect(parts).toEqual([
      { kind: "text", text: "Visit " },
      { kind: "link" },
      { kind: "text", text: " or " },
      { kind: "link" },
      { kind: "text", text: ". " },
      { kind: "text", text: "Tsplits™" },
      { kind: "text", text: " already has a mark. " },
      { kind: "text", text: "Tsplits™" },
      { kind: "text", text: " and " },
      { kind: "text", text: "Tsplits™" },
      { kind: "text", text: " do not." },
    ]);
    expect(parts.filter((part) => part.kind === "text" && part.text.includes("™™"))).toEqual([]);
    expect(read("components/talispros/GuideConversationPanel.tsx")).toContain(
      "AgentTranscriptLine",
    );
    expect(read("components/talispros/AgentTranscriptLine.tsx")).toContain(
      'href="https://tsplits.com"',
    );
    expect(read("components/talispros/AgentTranscriptLine.tsx")).toContain("tsplits.com");
  });
});
