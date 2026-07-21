import {
  TALISBOOKS_AGENT_BROKERAGE_PAGE_2,
  TALISBOOKS_AGENT_BROKERAGE_PAGE_3,
  TALISBOOKS_COVER_PAGE_NUMBER,
  TALISBOOKS_FIRST_PROPERTY_PAGE,
  TALISBOOKS_MAXIMUM_CONTENT_PAGES,
  TALISBOOKS_MAXIMUM_PAGE_COUNT,
  TALISBOOKS_MINIMUM_CONTENT_PAGES,
  TALISBOOKS_MINIMUM_PAGE_COUNT,
  TALISBOOKS_PAGE_RULE_CODES,
} from "./constants";
import {
  brokeragesMatch,
  isBrokerageComplianceComplete,
} from "./brokerage-compliance";
import type {
  TalisBooksPageRuleViolation,
  TalisBooksValidatedPage,
} from "./types";

function getPage(pages: TalisBooksValidatedPage[], pageNumber: number): TalisBooksValidatedPage | null {
  return pages.find((page) => page.pageNumber === pageNumber) ?? null;
}

export function hasPropertyPhoto(page: TalisBooksValidatedPage): boolean {
  if (page.backgroundImageCategory === "property") {
    return true;
  }

  return page.blocks.some(
    (block) => block.type === "property_photo" || block.imageCategory === "property",
  );
}

export function hasAgentSection(page: TalisBooksValidatedPage): boolean {
  return page.blocks.some((block) => block.type === "agent");
}

export function hasBrokerageSection(page: TalisBooksValidatedPage): boolean {
  return page.blocks.some((block) => block.type === "brokerage");
}

export function isAgentBrokeragePage(page: TalisBooksValidatedPage | null): boolean {
  return page?.pageRole === "agent_brokerage";
}

export function pagesMatchAgentBrokerageLayout(
  reference: TalisBooksValidatedPage,
  candidate: TalisBooksValidatedPage,
): boolean {
  if (reference.pageRole !== "agent_brokerage" || candidate.pageRole !== "agent_brokerage") {
    return false;
  }

  if (!hasAgentSection(reference) || !hasBrokerageSection(reference)) {
    return false;
  }

  if (!hasAgentSection(candidate) || !hasBrokerageSection(candidate)) {
    return false;
  }

  if (!isBrokerageComplianceComplete(reference.brokerageCompliance)) {
    return false;
  }

  if (!isBrokerageComplianceComplete(candidate.brokerageCompliance)) {
    return false;
  }

  if (!brokeragesMatch(reference.brokerageCompliance, candidate.brokerageCompliance)) {
    return false;
  }

  if (reference.layoutSlug && candidate.layoutSlug && reference.layoutSlug !== candidate.layoutSlug) {
    return false;
  }

  if (reference.layoutType && candidate.layoutType && reference.layoutType !== candidate.layoutType) {
    return false;
  }

  return true;
}

export function validatePageSequence(pages: TalisBooksValidatedPage[]): TalisBooksPageRuleViolation[] {
  const violations: TalisBooksPageRuleViolation[] = [];

  if (pages.length === 0) {
    return violations;
  }

  const numbers = pages.map((page) => page.pageNumber).sort((a, b) => a - b);

  for (let index = 0; index < numbers.length; index += 1) {
    const expected = index + 1;
    if (numbers[index] !== expected) {
      violations.push({
        code: TALISBOOKS_PAGE_RULE_CODES.PAGE_SEQUENCE,
        message: `Pages must be numbered sequentially from 1. Expected page ${expected}, found ${numbers[index] ?? "none"}.`,
        pageNumber: numbers[index],
      });
      break;
    }
  }

  return violations;
}

/**
 * Enforces official book size: 12–22 total pages
 * (10–20 content pages + front cover + back cover).
 * Publishing outside these limits is rejected with no overrides.
 */
export function validatePageCount(pages: TalisBooksValidatedPage[]): TalisBooksPageRuleViolation[] {
  const count = pages.length;

  if (count < TALISBOOKS_MINIMUM_PAGE_COUNT) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.MINIMUM_PAGES,
        message: `Books require at least ${TALISBOOKS_MINIMUM_PAGE_COUNT} pages (${TALISBOOKS_MINIMUM_CONTENT_PAGES} content pages + front cover + back cover). Found ${count}.`,
      },
    ];
  }

  if (count > TALISBOOKS_MAXIMUM_PAGE_COUNT) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.MAXIMUM_PAGES,
        message: `Books may have at most ${TALISBOOKS_MAXIMUM_PAGE_COUNT} pages (${TALISBOOKS_MAXIMUM_CONTENT_PAGES} content pages + front cover + back cover). Found ${count}.`,
      },
    ];
  }

  return [];
}

/** @deprecated Prefer validatePageCount — kept for callers that only check minimum. */
export function validateMinimumPageCount(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRuleViolation[] {
  return validatePageCount(pages).filter(
    (violation) => violation.code === TALISBOOKS_PAGE_RULE_CODES.MINIMUM_PAGES,
  );
}

export function validateCoverPage(pages: TalisBooksValidatedPage[]): TalisBooksPageRuleViolation[] {
  const cover = getPage(pages, TALISBOOKS_COVER_PAGE_NUMBER);
  if (!cover) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.COVER_PAGE_1,
        message: "Page 1 is required and must be the cover.",
        pageNumber: TALISBOOKS_COVER_PAGE_NUMBER,
      },
    ];
  }

  if (cover.pageRole !== "cover") {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.COVER_PAGE_1,
        message: "Page 1 must use the cover layout.",
        pageNumber: TALISBOOKS_COVER_PAGE_NUMBER,
      },
    ];
  }

  return [];
}

export function validateAgentBrokeragePage(
  page: TalisBooksValidatedPage | null,
  pageNumber: number,
  code:
    | typeof TALISBOOKS_PAGE_RULE_CODES.AGENT_BROKERAGE_PAGE_2
    | typeof TALISBOOKS_PAGE_RULE_CODES.AGENT_BROKERAGE_PAGE_3,
): TalisBooksPageRuleViolation[] {
  if (!page) {
    return [
      {
        code,
        message: `Page ${pageNumber} is required and must contain brokerage and agent sections.`,
        pageNumber,
      },
    ];
  }

  const violations: TalisBooksPageRuleViolation[] = [];

  if (page.pageRole !== "agent_brokerage") {
    violations.push({
      code,
      message: `Page ${pageNumber} must be a brokerage and agent page.`,
      pageNumber,
    });
  }

  if (!hasAgentSection(page)) {
    violations.push({
      code,
      message: `Page ${pageNumber} must include an agent section.`,
      pageNumber,
    });
  }

  if (!hasBrokerageSection(page)) {
    violations.push({
      code,
      message: `Page ${pageNumber} must include a brokerage section.`,
      pageNumber,
    });
  }

  return violations;
}

/** Property images are never allowed on pages 2 or 3. */
export function validateNoPropertyPhotosOnEarlyPages(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRuleViolation[] {
  const violations: TalisBooksPageRuleViolation[] = [];

  for (const pageNumber of [TALISBOOKS_AGENT_BROKERAGE_PAGE_2, TALISBOOKS_AGENT_BROKERAGE_PAGE_3]) {
    const page = getPage(pages, pageNumber);
    if (page && hasPropertyPhoto(page)) {
      violations.push({
        code: TALISBOOKS_PAGE_RULE_CODES.NO_PROPERTY_PHOTOS_EARLY,
        message: `Property images are never allowed on page ${pageNumber}.`,
        pageNumber,
      });
    }
  }

  return violations;
}

/**
 * Pages 4 through (last − 1) must be property content.
 * At maximum book size this is pages 4–21.
 */
export function validateInteriorPages(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRuleViolation[] {
  if (pages.length < TALISBOOKS_MINIMUM_PAGE_COUNT) {
    return [];
  }

  const lastPageNumber = pages[pages.length - 1]?.pageNumber;
  if (!lastPageNumber) {
    return [];
  }

  const violations: TalisBooksPageRuleViolation[] = [];

  for (const page of pages) {
    if (page.pageNumber < TALISBOOKS_FIRST_PROPERTY_PAGE) {
      continue;
    }
    if (page.pageNumber >= lastPageNumber) {
      continue;
    }
    if (page.pageRole !== "property_content") {
      violations.push({
        code: TALISBOOKS_PAGE_RULE_CODES.INTERIOR_PROPERTY_CONTENT,
        message: `Page ${page.pageNumber} must be property content.`,
        pageNumber: page.pageNumber,
      });
    }
  }

  return violations;
}

/** Final page (back cover) must repeat page 3 — no property images. */
export function validateLastPageMatchesPageThree(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRuleViolation[] {
  if (pages.length < TALISBOOKS_MINIMUM_PAGE_COUNT) {
    return [];
  }

  const pageThree = getPage(pages, TALISBOOKS_AGENT_BROKERAGE_PAGE_3);
  const lastPage = pages[pages.length - 1];

  if (!pageThree || !lastPage) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.LAST_PAGE_MATCHES_PAGE_3,
        message: "The final page must repeat the page 3 brokerage and agent layout.",
        pageNumber: lastPage?.pageNumber,
      },
    ];
  }

  if (lastPage.pageNumber === TALISBOOKS_AGENT_BROKERAGE_PAGE_3) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.LAST_PAGE_MATCHES_PAGE_3,
        message: "The final page must be a separate back-cover page that repeats page 3.",
        pageNumber: lastPage.pageNumber,
      },
    ];
  }

  if (!pagesMatchAgentBrokerageLayout(pageThree, lastPage)) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.LAST_PAGE_MATCHES_PAGE_3,
        message:
          "The final page must automatically duplicate the page 3 brokerage layout and compliance information.",
        pageNumber: lastPage.pageNumber,
      },
    ];
  }

  if (hasPropertyPhoto(lastPage)) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.NO_PROPERTY_PHOTOS_EARLY,
        message: "Property images are never allowed on the final page when it repeats page 3.",
        pageNumber: lastPage.pageNumber,
      },
    ];
  }

  return [];
}
