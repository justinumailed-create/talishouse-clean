import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertNoTalishouseInBotCopy,
  TALISBOT_KNOWLEDGE,
  TALISBOT_SYSTEM_ROLE,
  getTalisBotSystemRole,
} from "../lib/talispros/talisbot-knowledge";
import { en } from "../lib/i18n/dictionaries/en";

describe("TalisBOT Talispros™ knowledge", () => {
  it("never mentions Talishouse in system role or knowledge", () => {
    expect(assertNoTalishouseInBotCopy(TALISBOT_SYSTEM_ROLE)).toBe(true);
    for (const item of TALISBOT_KNOWLEDGE) {
      expect(assertNoTalishouseInBotCopy(item.title + item.body)).toBe(true);
    }
    expect(TALISBOT_SYSTEM_ROLE).toContain("Mapsites™");
    expect(TALISBOT_SYSTEM_ROLE).toContain("Talisbooks™");
    expect(TALISBOT_SYSTEM_ROLE).toMatch(/Do not discuss or recommend/i);
    expect(TALISBOT_SYSTEM_ROLE).toContain("Talispros™");
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
    expect(bot).toMatch(/\n\s*\{b\.faq\}\n/);
    expect(en.bot.faq).toBe("FAQ");
    expect(bot).toContain('href="/talisu#faq"');
    expect(bot).not.toContain("Talispros FAQ");
    expect(en.bot.subtitle).toBe("Talispros™ processes");
    expect(bot).toContain("TALISU_MKTS_HEADER_BLUE");
    expect(bot).toContain("OwnershipLearnMoreForm");
    expect(en.bot.getHelp).toBe("Get help / leave contact");
    expect(bot).not.toContain("TALISBOT_INTEREST_OPTIONS");
    expect(bot).not.toMatch(/text-green-500|bg-green-500|bg-green-50|text-green-600/);
  });
});
