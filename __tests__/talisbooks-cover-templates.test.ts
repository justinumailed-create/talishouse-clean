import { describe, expect, it } from "vitest";
import {
  TALISBOOKS_COVER_MARGIN_RATIO,
  TALISBOOKS_COVER_TEMPLATE_IDS,
  getCoverTemplateById,
  getCoverTemplateBySlug,
  isTalisBooksCoverTemplateId,
  listCoverTemplates,
  selectCoverTemplate,
  selectRandomCoverTemplate,
} from "../lib/talisbooks/covers";

describe("TalisBooks premium cover templates", () => {
  it("exposes exactly five distinct cover templates", () => {
    const templates = listCoverTemplates();
    expect(templates).toHaveLength(5);
    expect(TALISBOOKS_COVER_TEMPLATE_IDS).toHaveLength(5);
    expect(new Set(templates.map((template) => template.id)).size).toBe(5);
  });

  it("includes hero, title, subtitle, and white top/bottom margins on every template", () => {
    for (const template of listCoverTemplates()) {
      expect(template.templateType).toBe("cover");
      expect(template.layoutType).toBe("cover");
      expect(template.config.fields).toEqual(["title", "subtitle", "heroImage"]);
      expect(template.config.regions.topMargin).toBe("white");
      expect(template.config.regions.bottomMargin).toBe("white");
      expect(template.config.regions.hero).toBe("image");
      expect(template.config.hero.fit).toBe("cover");
      expect(template.margins.top).toBe(TALISBOOKS_COVER_MARGIN_RATIO);
      expect(template.margins.bottom).toBe(TALISBOOKS_COVER_MARGIN_RATIO);
      expect(template.margins.unit).toBe("ratio");
      expect(template.cssClasses).toContain("talisbooks-cover");
    }
  });

  it("keeps title placements distinct across the five layouts", () => {
    const placements = listCoverTemplates().map((template) => template.titlePlacement);
    expect(new Set(placements).size).toBe(5);
  });

  it("supports manual selection by id", () => {
    const template = getCoverTemplateById("vista-overlay");
    expect(template?.name).toBe("Vista Overlay");
    expect(template?.titlePlacement).toBe("hero-lower-left");
  });

  it("supports manual selection by slug", () => {
    const template = getCoverTemplateBySlug("cover-masthead-rise");
    expect(template?.id).toBe("masthead-rise");
  });

  it("returns null for unknown manual selections", () => {
    expect(getCoverTemplateById("missing")).toBeNull();
    expect(getCoverTemplateBySlug("missing")).toBeNull();
    expect(isTalisBooksCoverTemplateId("missing")).toBe(false);
  });

  it("supports deterministic random selection", () => {
    const first = selectRandomCoverTemplate(() => 0);
    const mid = selectRandomCoverTemplate(() => 0.5);
    const last = selectRandomCoverTemplate(() => 0.999);

    expect(first.id).toBe("aurora-frame");
    expect(mid.id).toBe("masthead-rise");
    expect(last.id).toBe("vista-overlay");
  });

  it("supports selectCoverTemplate for both manual and random paths", () => {
    expect(selectCoverTemplate("horizon-caption").id).toBe("horizon-caption");
    expect(selectCoverTemplate("random", () => 0.2).id).toBe("horizon-caption");
  });
});
