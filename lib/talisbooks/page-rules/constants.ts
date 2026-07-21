/** Fixed positions in the official TalisBooks™ page sequence. */
export const TALISBOOKS_COVER_PAGE_NUMBER = 1;
export const TALISBOOKS_AGENT_BROKERAGE_PAGE_2 = 2;
export const TALISBOOKS_AGENT_BROKERAGE_PAGE_3 = 3;
export const TALISBOOKS_FIRST_PROPERTY_PAGE = 4;

/**
 * Official book size rules:
 * - Minimum 12 pages = 10 content + front cover + back cover
 * - Maximum 22 pages = 20 content + front cover + back cover
 */
export const TALISBOOKS_MINIMUM_PAGE_COUNT = 12;
export const TALISBOOKS_MAXIMUM_PAGE_COUNT = 22;
export const TALISBOOKS_MINIMUM_CONTENT_PAGES = 10;
export const TALISBOOKS_MAXIMUM_CONTENT_PAGES = 20;

/** Property interior pages sit between page 3 and the closing (back) page. */
export const TALISBOOKS_MAXIMUM_PROPERTY_PAGE_NUMBER = 21;

export const TALISBOOKS_PAGE_RULE_CODES = {
  PAGE_SEQUENCE: "page_sequence",
  MINIMUM_PAGES: "minimum_pages",
  MAXIMUM_PAGES: "maximum_pages",
  COVER_PAGE_1: "cover_page_1",
  AGENT_BROKERAGE_PAGE_2: "agent_brokerage_page_2",
  AGENT_BROKERAGE_PAGE_3: "agent_brokerage_page_3",
  NO_PROPERTY_PHOTOS_EARLY: "no_property_photos_early",
  BROKERAGE_COMPLIANCE_MISSING: "brokerage_compliance_missing",
  INTERIOR_PROPERTY_CONTENT: "interior_property_content",
  LAST_PAGE_MATCHES_PAGE_3: "last_page_matches_page_3",
} as const;

export type TalisBooksPageRuleCode =
  (typeof TALISBOOKS_PAGE_RULE_CODES)[keyof typeof TALISBOOKS_PAGE_RULE_CODES];
