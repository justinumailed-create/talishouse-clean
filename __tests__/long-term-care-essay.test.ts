import { describe, expect, it } from "vitest";
import { TALISU_ESSAYS, resolveTalisUEssaySlug } from "../components/talisu/essay-registry";
import { TALISU_LONG_TERM_CARE_ESSAY } from "../lib/talisu/long-term-care-essay";

describe("Long-Term Care essay tab", () => {
  it("is the 4th tab with EN/DE labels and 6 Coming soon placeholders", () => {
    expect(TALISU_ESSAYS[3]?.slug).toBe("long-term-care");
    expect(TALISU_ESSAYS[3]?.label).toEqual({ en: "Long-Term Care", de: "Langzeitpflege" });
    expect(TALISU_ESSAYS.filter((e) => e.content === null)).toHaveLength(6);
    expect(resolveTalisUEssaySlug("long-term-care")).toBe("long-term-care");
  });

  it("has EN + DE with matching structure, visuals, A-D cards and CAD only", () => {
    const { en, de } = TALISU_LONG_TERM_CARE_ESSAY;
    expect(de.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id));
    expect(en.sections).toHaveLength(8);
    for (const essay of [en, de]) {
      const blocks = essay.sections.flatMap((s) => s.blocks);
      const types = blocks.map((b) => b.type);
      expect(types.filter((t) => t === "flow")).toHaveLength(2);
      expect(types).toContain("valuation");
      expect(types).toContain("split");
      expect(types).toContain("table");
      const options = blocks.find((b) => b.type === "options");
      expect(options && options.type === "options" ? options.items.map((i) => i.letter) : []).toEqual(["A", "B", "C", "D"]);
      const text = JSON.stringify(essay);
      expect(text).not.toMatch(/(?<!CA)\$/);
      expect(text).toContain("CA$30");
    }
  });
});
