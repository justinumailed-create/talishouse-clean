import { TALISBOOKS_COVER_TEMPLATE_IDS, type TalisBooksCoverTemplateId } from "./constants";
import { TALISBOOKS_COVER_TEMPLATES, TALISBOOKS_COVER_TEMPLATE_LIST } from "./catalog";
import type { TalisBooksCoverTemplateDefinition } from "./types";

export function isTalisBooksCoverTemplateId(
  value: string,
): value is TalisBooksCoverTemplateId {
  return (TALISBOOKS_COVER_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Manual selection by stable template id. */
export function getCoverTemplateById(
  id: string,
): TalisBooksCoverTemplateDefinition | null {
  if (!isTalisBooksCoverTemplateId(id)) {
    return null;
  }
  return TALISBOOKS_COVER_TEMPLATES[id];
}

/** Manual selection by slug (matches DB seed). */
export function getCoverTemplateBySlug(
  slug: string,
): TalisBooksCoverTemplateDefinition | null {
  return TALISBOOKS_COVER_TEMPLATE_LIST.find((template) => template.slug === slug) ?? null;
}

export function listCoverTemplates(): TalisBooksCoverTemplateDefinition[] {
  return [...TALISBOOKS_COVER_TEMPLATE_LIST];
}

/**
 * Random selection among premium covers.
 * Pass `random` for deterministic tests (defaults to Math.random).
 */
export function selectRandomCoverTemplate(
  random: () => number = Math.random,
): TalisBooksCoverTemplateDefinition {
  const index = Math.floor(random() * TALISBOOKS_COVER_TEMPLATE_IDS.length);
  const safeIndex = Math.min(
    Math.max(index, 0),
    TALISBOOKS_COVER_TEMPLATE_IDS.length - 1,
  );
  return TALISBOOKS_COVER_TEMPLATES[TALISBOOKS_COVER_TEMPLATE_IDS[safeIndex]];
}

export function selectCoverTemplate(
  selection: TalisBooksCoverTemplateId | "random",
  random: () => number = Math.random,
): TalisBooksCoverTemplateDefinition {
  if (selection === "random") {
    return selectRandomCoverTemplate(random);
  }
  return TALISBOOKS_COVER_TEMPLATES[selection];
}
