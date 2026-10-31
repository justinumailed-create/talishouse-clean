import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertNoTalishouseInBotCopy,
  TALISBOT_KNOWLEDGE,
  TALISBOT_SYSTEM_ROLE,
  getTalisBotSystemRole,
} from "../lib/talispros/talisbot-knowledge";
import { de } from "../lib/i18n/dictionaries/de";
import { en } from "../lib/i18n/dictionaries/en";

describe("TalisBOT Tsplits™ knowledge", () => {
  it("never mentions Talishouse in system role or knowledge", () => {
    expect(assertNoTalishouseInBotCopy(TALISBOT_SYSTEM_ROLE)).toBe(true);
    for (const item of TALISBOT_KNOWLEDGE) {
      expect(assertNoTalishouseInBotCopy(item.title + item.body)).toBe(true);
    }
    expect(TALISBOT_SYSTEM_ROLE).toContain("Mapsites");
    expect(TALISBOT_SYSTEM_ROLE).toContain("Talisbooks™");
    expect(TALISBOT_SYSTEM_ROLE).toMatch(/Do not discuss or recommend/i);
    expect(TALISBOT_SYSTEM_ROLE).toContain("Tsplits™");
  });

  it("wires knowledge into TalisBotChat without Talishouse product types", () => {
    const bot = readFileSync(resolve("components/TalisBotChat.tsx"), "utf8");
    // Role + knowledge are locale-aware (EN from TALISBOT_*, DE from de.ts).
    expect(bot).toContain("getTalisBotSystemRole(locale)");
    expect(bot).toContain("b.knowledge");
    expect(en.bot.knowledge).toBe(TALISBOT_KNOWLEDGE);
    expect(getTalisBotSystemRole("en")).toBe(TALISBOT_SYSTEM_ROLE);
    expect(getTalisBotSystemRole("de")).toMatch(/German/);
    expect(bot).not.toMatch(/Talishouse \(Recreational\)/);
    expect(bot).not.toMatch(/Talishouse \(Residential\)/);
    expect(bot).toMatch(/\n\s*\{b\.exploreTsplits\}\n/);
    expect(en.bot.exploreTsplits).toBe("Explore Tsplits");
    expect(de.bot.exploreTsplits).toBe("Tsplits entdecken");
    expect(bot).toContain('href={talisuHref("/talisu/tsplits")}');
    expect(bot).not.toContain("Tsplits™ FAQ");
    expect(en.bot.subtitle).toBe("Engage without registering first");
    expect(bot).toContain("TALISU_MKTS_HEADER_BLUE");
    expect(bot).toContain("OwnershipLearnMoreForm");
    expect(en.bot.getHelp).toBe("Share a Project Vision");
    expect("getHelpNote" in en.bot).toBe(false);
    expect(bot).not.toContain("talisbot-discuss-page");
    expect(bot).not.toContain("TALISU_GLOBAL_ADMIN_URL");
    expect(bot).not.toContain("https://talisu.com");
    expect(bot).toMatch(
      /<Link\s+href=\{ROUTES\.ADMIN_LOGIN\}\s+target="_blank"\s+rel="noopener noreferrer"[^>]*data-testid="talisbot-global-admin-link"/,
    );
    expect(bot).toContain("talisuHref(TALISU_DISCUSS_PATH)");
    expect(bot).not.toContain("TALISBOT_INTEREST_OPTIONS");
    expect(bot).not.toMatch(/text-green-500|bg-green-500|bg-green-50|text-green-600/);
  });
});
