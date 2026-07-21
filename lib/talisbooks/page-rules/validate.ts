import { TALISBOOKS_PAGE_RULE_CODES } from "./constants";
import { validateMandatoryBrokeragePages } from "./brokerage-compliance";
import { normalizeBookPagesForValidation } from "./normalize";
import {
  validateAgentBrokeragePage,
  validateCoverPage,
  validateInteriorPages,
  validateLastPageMatchesPageThree,
  validateNoPropertyPhotosOnEarlyPages,
  validatePageCount,
  validatePageSequence,
} from "./rules";
import type {
  TalisBooksBookPage,
  TalisBooksPublishStatus,
} from "../types";
import type {
  TalisBooksPageRulesValidationResult,
  TalisBooksPublishValidationResult,
  TalisBooksValidatedPage,
} from "./types";

const PUBLISH_GATE_STATUSES: TalisBooksPublishStatus[] = [
  "in_review",
  "scheduled",
  "published",
];

export function validateTalisBooksPageRules(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRulesValidationResult {
  const violations = [
    ...validatePageSequence(pages),
    ...validatePageCount(pages),
    ...validateCoverPage(pages),
    ...validateAgentBrokeragePage(
      pages.find((page) => page.pageNumber === 2) ?? null,
      2,
      TALISBOOKS_PAGE_RULE_CODES.AGENT_BROKERAGE_PAGE_2,
    ),
    ...validateAgentBrokeragePage(
      pages.find((page) => page.pageNumber === 3) ?? null,
      3,
      TALISBOOKS_PAGE_RULE_CODES.AGENT_BROKERAGE_PAGE_3,
    ),
    ...validateMandatoryBrokeragePages(pages),
    ...validateNoPropertyPhotosOnEarlyPages(pages),
    ...validateInteriorPages(pages),
    ...validateLastPageMatchesPageThree(pages),
  ];

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function validateTalisBooksBookPages(
  pages: TalisBooksBookPage[],
): TalisBooksPublishValidationResult {
  const normalized = normalizeBookPagesForValidation(pages);
  const result = validateTalisBooksPageRules(normalized);

  return {
    ...result,
    pageCount: normalized.length,
  };
}

export function requiresPageRulesValidation(status: TalisBooksPublishStatus): boolean {
  return PUBLISH_GATE_STATUSES.includes(status);
}

export function assertValidForPublishing(
  pages: TalisBooksBookPage[],
): TalisBooksPublishValidationResult {
  const result = validateTalisBooksBookPages(pages);

  if (!result.valid) {
    const summary = result.violations.map((violation) => violation.message).join(" ");
    throw new Error(`TalisBooks publish validation failed: ${summary}`);
  }

  return result;
}
