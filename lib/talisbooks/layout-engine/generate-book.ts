import {
  TALISBOOKS_FIRST_PROPERTY_PAGE,
  TALISBOOKS_MAXIMUM_PAGE_COUNT,
  TALISBOOKS_MINIMUM_PAGE_COUNT,
} from "../page-rules/constants";
import { classifyLayoutAssets } from "./classify";
import { decidePlacements, emptyPlacementCounts } from "./decide";
import { generatePagesFromDecisions, pagesNeededForDecision } from "./generate-pages";
import type {
  GenerateBookPagesOptions,
  TalisBooksLayoutDecision,
  TalisBooksLayoutEngineResult,
  TalisBooksLayoutImageRef,
  TalisBooksLayoutOrientation,
  TalisBooksLayoutPlacement,
} from "./types";

/**
 * Max property pages for a valid book:
 * total ≤ 22 → property pages ≤ 18 (pages 4–21) with closing on 22.
 */
export function maxPropertyPageBudget(options?: GenerateBookPagesOptions): number {
  if (options?.maxPropertyPages != null) {
    return options.maxPropertyPages;
  }
  // Cover(1) + agent(2–3) + property(N) + closing(1) ≤ 22 → N ≤ 18
  return TALISBOOKS_MAXIMUM_PAGE_COUNT - TALISBOOKS_FIRST_PROPERTY_PAGE;
}

/**
 * Minimum property pages so total book size reaches 12:
 * Cover + pages 2–3 + property + closing ≥ 12 → property ≥ 8
 */
export function minPropertyPageBudget(): number {
  return TALISBOOKS_MINIMUM_PAGE_COUNT - TALISBOOKS_FIRST_PROPERTY_PAGE;
}

function emptyOrientationCounts(): Record<TalisBooksLayoutOrientation, number> {
  return {
    landscape: 0,
    portrait: 0,
    square: 0,
    panorama: 0,
  };
}

/**
 * Automatic book layout engine.
 *
 * Input: uploaded images (and future floorplan / PDF refs).
 * Output: property content pages with engine-chosen placements.
 * Users do not manually design pages.
 */
export function generateBookPagesFromUploads(
  uploads: TalisBooksLayoutImageRef[],
  options: GenerateBookPagesOptions = {},
): TalisBooksLayoutEngineResult {
  const startPageNumber = options.startPageNumber ?? TALISBOOKS_FIRST_PROPERTY_PAGE;
  const maxPages = maxPropertyPageBudget(options);

  const classified = classifyLayoutAssets(uploads);
  const byOrientation = emptyOrientationCounts();
  for (const asset of classified) {
    byOrientation[asset.orientation] += 1;
  }

  const decisions = decidePlacements(classified);
  const byPlacement = emptyPlacementCounts();
  for (const decision of decisions) {
    byPlacement[decision.placement] += 1;
  }

  const usedDecisions: TalisBooksLayoutDecision[] = [];
  const skippedDecisions: TalisBooksLayoutDecision[] = [];
  let pageCount = 0;

  for (const decision of decisions) {
    const needed = pagesNeededForDecision(decision);
    if (pageCount + needed > maxPages) {
      skippedDecisions.push(decision);
      continue;
    }
    usedDecisions.push(decision);
    pageCount += needed;
  }

  const pages = generatePagesFromDecisions(usedDecisions, startPageNumber);

  const skipped = skippedDecisions.flatMap((decision) =>
    decision.assets.map((asset) => ({
      imageId: asset.id,
      reason: `Exceeded maximum property page budget (${maxPages}).`,
    })),
  );

  return {
    decisions: usedDecisions,
    pages,
    skipped,
    stats: {
      totalInputs: uploads.length,
      pagesGenerated: pages.length,
      byOrientation,
      byPlacement: usedDecisions.reduce((counts, decision) => {
        counts[decision.placement] += 1;
        return counts;
      }, emptyPlacementCounts() as Record<TalisBooksLayoutPlacement, number>),
    },
  };
}

/**
 * True when generated property pages can fit a book within official size rules
 * once cover, agent/brokerage pages, and closing page are attached.
 */
export function propertyPagesFitBookRules(propertyPageCount: number): boolean {
  const total = propertyPageCount + TALISBOOKS_FIRST_PROPERTY_PAGE; // + cover + 2 agent + closing after property
  // total = 1 cover + 2 agent + property + 1 closing = property + 4
  // Wait: FIRST_PROPERTY_PAGE is 4, so cover+agents = 3 pages before property.
  // total = 3 + property + 1 = property + 4
  const bookTotal = propertyPageCount + 4;
  return (
    bookTotal >= TALISBOOKS_MINIMUM_PAGE_COUNT && bookTotal <= TALISBOOKS_MAXIMUM_PAGE_COUNT
  );
}
