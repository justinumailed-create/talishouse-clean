import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
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
    const home = read("components/talispros/TalisprosGatePage.tsx");
    const mapsite = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(home).toContain("<AishaConvaiWidget />");
    expect(home).not.toContain(AISHA_MAPSITE_AGENT_ID);
    expect(mapsite).toContain("agentId={AISHA_MAPSITE_AGENT_ID}");
    expect(mapsite).toContain("aishaMapsiteDynamicVariables");
  });

  it("uses the stored first name, then the display name, and never a guessed split", () => {
    expect(aishaOwnerName({ ownerFirstName: " Doug ", agentName: "Doug Copp" })).toBe("Doug");
    expect(aishaOwnerName({ ownerFirstName: "", agentName: "Doug Copp" })).toBe("Doug Copp");
    expect(aishaOwnerName({ ownerFirstName: null, agentName: "  " })).toBeNull();
  });

  it("omits blank keys and escapes the JSON for an HTML attribute", () => {
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
      aishaMapsiteDynamicVariables({
        ownerFirstName: "  ",
        agentName: null,
        fastCode: "dc06",
        mapsiteTitle: "",
      }),
    ).toBe('{"fast_code":"dc06"}');
    expect(
      aishaMapsiteDynamicVariables({
        ownerFirstName: null,
        agentName: null,
        fastCode: " ",
        mapsiteTitle: null,
      }),
    ).toBeUndefined();
  });
});
