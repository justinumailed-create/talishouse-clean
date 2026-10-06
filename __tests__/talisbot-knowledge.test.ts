import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertNoTalishouseInBotCopy,
  TALISBOT_KNOWLEDGE,
  TALISBOT_SYSTEM_ROLE,
} from "../lib/talispros/talisbot-knowledge";

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
    expect(bot).toContain("TALISBOT_SYSTEM_ROLE");
    expect(bot).toContain("TALISBOT_KNOWLEDGE");
    expect(bot).not.toMatch(/Talishouse \(Recreational\)/);
    expect(bot).not.toMatch(/Talishouse \(Residential\)/);
    expect(bot).toMatch(/\n\s*FAQ\n/);
    expect(bot).toContain('href="/talisu#faq"');
    expect(bot).not.toContain("Talispros FAQ");
    expect(bot).toContain("Talispros™ processes");
    expect(bot).toContain("TALISU_MKTS_HEADER_BLUE");
    expect(bot).toContain("OwnershipLearnMoreForm");
    expect(bot).toContain("Get help / leave contact");
    expect(bot).not.toContain("TALISBOT_INTEREST_OPTIONS");
    expect(bot).not.toMatch(/text-green-500|bg-green-500|bg-green-50|text-green-600/);
  });
});
