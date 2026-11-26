import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import {
  FLAG_MESSAGE_LINE_COUNT,
  FLAG_MESSAGE_POPOVER_WIDTH_CLASS,
  FLAG_MESSAGE_TEXT_CLASS,
  FLAG_MESSAGE_WRAP_CHARS,
  RALF_FLAG_MESSAGES,
  countWrappedLines,
} from "../lib/talispros/mapsite-flag-messages";

const read = (p: string) => readFileSync(resolve(p), "utf8");

const FLAG_KEYS = ["url", "teb", "tva", "ttv"] as const;

describe("Mapsite Flag messages", () => {
  it("matches Ralf's updated copy for URL, TEB™, TVA, and TTV", () => {
    for (const key of FLAG_KEYS) {
      expect(en.mapsite.pinActions[key]).toBe(RALF_FLAG_MESSAGES[key]);
    }
    expect(en.mapsite.pinActions.url).toBe(
      "A link to an outside resource for this PIN, such as a website or listing page.",
    );
    expect(en.mapsite.pinActions.teb).toBe(
      "Digital lead magnets that attract prospects and differentiate in competitive markets.",
    );
    expect(en.mapsite.pinActions.tva).toBe(
      "A remote showing: up to ten rooms/scenes with you narrating a virtual walk-through.",
    );
    expect(en.mapsite.pinActions.ttv).toBe(
      "In-house online TV - Infomercials, green screen technology, you are the host or co-host.",
    );
  });

  it("uses the same Flag copy for all four account levels", () => {
    const explainer = read("components/talispros/mapsite/PinActionExplainer.tsx");
    const popup = read("components/talispros/mapsite/MapSitePropertyPopup.tsx");
    expect(explainer).toContain("copy[action]");
    expect(explainer).not.toMatch(/accountType|account_type|broker|fsbo|adpro|agent/i);
    expect(popup).toContain("PinActionExplainer");
    expect(popup).toContain('mls: "tva"');
    expect(popup).not.toMatch(/pinActionsByAccount|accountType.*pinActions/);
  });

  it("lays out all four Flag messages with the same number of lines", () => {
    const enLines = FLAG_KEYS.map((key) =>
      countWrappedLines(en.mapsite.pinActions[key], FLAG_MESSAGE_WRAP_CHARS),
    );
    const deLines = FLAG_KEYS.map((key) =>
      countWrappedLines(de.mapsite.pinActions[key], FLAG_MESSAGE_WRAP_CHARS),
    );
    expect(new Set(enLines)).toEqual(new Set([FLAG_MESSAGE_LINE_COUNT]));
    expect(new Set(deLines)).toEqual(new Set([FLAG_MESSAGE_LINE_COUNT]));

    const explainer = read("components/talispros/mapsite/PinActionExplainer.tsx");
    expect(explainer).toContain("FLAG_MESSAGE_POPOVER_WIDTH_CLASS");
    expect(explainer).toContain("FLAG_MESSAGE_TEXT_CLASS");
    expect(FLAG_MESSAGE_TEXT_CLASS).toContain("min-h-[3lh]");
    expect(FLAG_MESSAGE_TEXT_CLASS).toContain("text-[16px]");
    expect(FLAG_MESSAGE_TEXT_CLASS).toContain("leading-relaxed");
    expect(FLAG_MESSAGE_POPOVER_WIDTH_CLASS).toContain("36ch");
  });

  it("does not render a Learn more link on the TTV Flag message", () => {
    const explainer = read("components/talispros/mapsite/PinActionExplainer.tsx");
    expect(explainer).not.toContain("learn-more");
    expect(explainer).not.toContain("learnMore");
    expect(explainer).not.toContain("Learn more");
    expect(explainer).not.toContain("copy.learnMore");
    expect(explainer).not.toMatch(/from "next\/link"/);
    expect(explainer).toContain('data-testid={`pin-action-explainer-${action}`}');
  });
});
