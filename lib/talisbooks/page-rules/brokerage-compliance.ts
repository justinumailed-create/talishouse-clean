import {
  TALISBOOKS_BROKERAGE_FIELD_LABELS,
  TALISBOOKS_BROKERAGE_REQUIRED_FIELDS,
  type TalisBooksBrokerageComplianceField,
} from "./brokerage-constants";
import { TALISBOOKS_PAGE_RULE_CODES } from "./constants";
import type {
  TalisBooksBrokerageCompliance,
  TalisBooksPageRuleViolation,
  TalisBooksValidatedPage,
} from "./types";

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isBrokerageFieldPresent(
  compliance: TalisBooksBrokerageCompliance | null,
  field: TalisBooksBrokerageComplianceField,
): boolean {
  if (!compliance) {
    return false;
  }
  return hasValue(compliance[field]);
}

export function getMissingBrokerageFields(
  compliance: TalisBooksBrokerageCompliance | null,
): TalisBooksBrokerageComplianceField[] {
  return TALISBOOKS_BROKERAGE_REQUIRED_FIELDS.filter(
    (field) => !isBrokerageFieldPresent(compliance, field),
  );
}

export function isBrokerageComplianceComplete(
  compliance: TalisBooksBrokerageCompliance | null,
): boolean {
  return getMissingBrokerageFields(compliance).length === 0;
}

/**
 * Two brokerage pages match when layout metadata and all compliance fields align.
 * The final page must automatically duplicate page 3.
 */
export function brokeragesMatch(
  reference: TalisBooksBrokerageCompliance | null,
  candidate: TalisBooksBrokerageCompliance | null,
): boolean {
  if (!reference || !candidate) {
    return false;
  }

  return TALISBOOKS_BROKERAGE_REQUIRED_FIELDS.every(
    (field) =>
      hasValue(reference[field]) &&
      hasValue(candidate[field]) &&
      reference[field]!.trim() === candidate[field]!.trim(),
  );
}

export function validateBrokerageCompliancePage(
  page: TalisBooksValidatedPage | null,
  pageNumber: number,
): TalisBooksPageRuleViolation[] {
  if (!page) {
    return [
      {
        code: TALISBOOKS_PAGE_RULE_CODES.BROKERAGE_COMPLIANCE_MISSING,
        message: `Page ${pageNumber} is required and must include complete brokerage compliance information.`,
        pageNumber,
      },
    ];
  }

  const missing = getMissingBrokerageFields(page.brokerageCompliance);
  return missing.map((field) => ({
    code: TALISBOOKS_PAGE_RULE_CODES.BROKERAGE_COMPLIANCE_MISSING,
    message: `Page ${pageNumber} is missing ${TALISBOOKS_BROKERAGE_FIELD_LABELS[field]}.`,
    pageNumber,
  }));
}

export function validateMandatoryBrokeragePages(
  pages: TalisBooksValidatedPage[],
): TalisBooksPageRuleViolation[] {
  const violations: TalisBooksPageRuleViolation[] = [];

  for (const pageNumber of [2, 3] as const) {
    const page = pages.find((entry) => entry.pageNumber === pageNumber) ?? null;
    violations.push(...validateBrokerageCompliancePage(page, pageNumber));
  }

  if (pages.length >= 4) {
    const lastPage = pages[pages.length - 1] ?? null;
    if (lastPage) {
      violations.push(...validateBrokerageCompliancePage(lastPage, lastPage.pageNumber));
    }
  }

  return violations;
}
