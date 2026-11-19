import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import {
  AISHA_HOMEPAGE_AGENT_ID,
  AISHA_MAPSITE_AGENT_ID,
  aishaMapsiteDynamicVariables,
  aishaOwnerName,
} from "../lib/talispros/aisha-mapsite-agent";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha agent by page", () => {
  it("keeps the homepage agent and uses a different one on a Mapsite", () => {
    expect(AISHA_HOMEPAGE_AGENT_ID).toBe("agent_0401m7cxgba1fhwb35aqr43acnv1");
    expect(AISHA_MAPSITE_AGENT_ID).toBe("agent_0201m7dr7y7bfy99sz2ywxcbshm4");
    const home = read("components/talispros/HomeAgentPair.tsx");
    const mapsite = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(home).toContain('href="/aisha"');
    expect(home).not.toContain("agentId=");
    expect(home).not.toContain(AISHA_MAPSITE_AGENT_ID);
    expect(read("components/talispros/TalisprosGatePage.tsx")).not.toContain(AISHA_MAPSITE_AGENT_ID);
    const aishaHome = read("app/aisha/page.tsx");
    const guide = read("components/talispros/GuideConversationPage.tsx");
    expect(aishaHome).toContain("<GuideConversationPage");
    expect(aishaHome).toContain("ASSISTANT_PERSONAS.aisha");
    expect(guide).toContain("<GuideConversationPanel");
    expect(guide).toContain("autoStart={call}");
    expect(aishaHome).not.toContain("agentId=");
    expect(aishaHome).not.toContain(AISHA_MAPSITE_AGENT_ID);
    expect(aishaHome).not.toContain("aisha-home-greeting");
    expect(aishaHome).toContain("copy.panelTitle");
    expect(en.home.assistants.aisha.panelTitle).toBe("Aisha C., AMBA");
    expect(guide).toContain("persona.portraitSrc");
    expect(mapsite).toContain("agentId={AISHA_MAPSITE_AGENT_ID}");
    expect(mapsite).toContain("aishaMapsiteDynamicVariables");
    const account = read("components/talispros/MapsiteAisha.tsx");
    expect(account).toContain("AISHA_MAPSITE_AGENT_ID");
    expect(account).toContain("aishaMapsiteDynamicVariables");
    expect(account).not.toContain("AISHA_HOMEPAGE_AGENT_ID");
    expect(read("app/home/[fastCode]/page.tsx")).toContain("<MapsiteAisha");
    expect(read("app/talispros/client/dashboard/page.tsx")).toContain("<MapsiteAisha");
    expect(read("app/talispros/mapsites/[fastCode]/edit/page.tsx")).toContain("<MapsiteAisha");
  });

  it("uses the stored first name, then the display name, and never a guessed split", () => {
    expect(aishaOwnerName({ ownerFirstName: " Doug ", agentName: "Doug Copp" })).toBe("Doug");
    expect(aishaOwnerName({ ownerFirstName: "", agentName: "Doug Copp" })).toBe("Doug Copp");
    expect(aishaOwnerName({ ownerFirstName: null, agentName: "  " })).toBe("there");
  });

  it("always sends owner_name, fast_code, and mapsite_title", () => {
    const json = aishaMapsiteDynamicVariables({
      ownerFirstName: 'Doug "Ace"',
      fastCode: " DC06 ",
      mapsiteTitle: "Loch <Lomond>",
    });
    expect(json).not.toMatch(/</);
    expect(JSON.parse(json!)).toEqual({
      owner_name: 'Doug "Ace"',
      fast_code: "DC06",
      mapsite_title: "Loch <Lomond>",
    });
    expect(
      JSON.parse(
        aishaMapsiteDynamicVariables({
          ownerFirstName: "  ",
          agentName: null,
          fastCode: "dc06",
          mapsiteTitle: "",
        })!,
      ),
    ).toEqual({
      owner_name: "there",
      fast_code: "dc06",
      mapsite_title: "",
    });
    expect(
      JSON.parse(
        aishaMapsiteDynamicVariables({
          ownerFirstName: null,
          agentName: null,
          fastCode: " ",
          mapsiteTitle: null,
        })!,
      ),
    ).toEqual({
      owner_name: "there",
      fast_code: "",
      mapsite_title: "",
    });
  });
});
