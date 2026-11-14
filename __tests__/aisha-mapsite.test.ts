import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";
import {
  fastCodeEntryHref,
  mapsiteShowsAisha,
} from "../lib/talispros/aisha-mapsites";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Aisha on an allowlisted Mapsite", () => {
  it("turns the widget on for DC06 only", () => {
    expect(mapsiteShowsAisha("DC06")).toBe(true);
    expect(mapsiteShowsAisha(" dc06 ")).toBe(true);
    expect(mapsiteShowsAisha("dc05")).toBe(false);
    expect(mapsiteShowsAisha("")).toBe(false);
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain("mapsiteShowsAisha(mapsite.fast_code)");
    expect(app).toContain('<AishaConvaiWidget invitation="callback" placement="bottom-right" />');
  });

  it("uses the call-back invitation in English and German", () => {
    expect(en.home.assistants.aisha.callback).toBe(
      "Hi, I'm Aisha. Would you like a call back?",
    );
    expect(de.home.assistants.aisha.callback).toBe(
      "Hallo, ich bin Aisha. Möchten Sie einen Rückruf?",
    );
    expect(en.home.assistants.aisha.greeting).not.toBe(en.home.assistants.aisha.callback);
  });

  it("sends DC06 from the FAST Code gate to the claimed Mapsite", () => {
    expect(fastCodeEntryHref({ fastCode: "DC06", accountType: "listings" })).toBe(
      "/talispros/mapsite/brokers/dc06",
    );
    expect(fastCodeEntryHref({ fastCode: "rm22", accountType: "brokers" })).toBe(
      "/talispros/home/rm22",
    );
    const actions = read("app/talispros/mapsites/actions.ts");
    expect(actions).toContain("fastCodeEntryHref");
    expect(actions).toContain("personalHomePath(resolvedCode)");
  });
});
