import { describe, expect, it } from "vitest";
import {
  TALISBOOKS_MAXIMUM_PAGE_COUNT,
  TALISBOOKS_MINIMUM_PAGE_COUNT,
  TALISBOOKS_PAGE_RULE_CODES,
  validateTalisBooksPageRules,
  type TalisBooksBrokerageCompliance,
  type TalisBooksValidatedPage,
} from "../lib/talisbooks/page-rules";

const COMPLIANCE: TalisBooksBrokerageCompliance = {
  brokerLogoId: "logo-1",
  brokerName: "Talispros Partner Realty",
  agentPhotoId: "agent-photo-1",
  agentContact: "alex@example.com · 416-555-0100",
  headline: "Your trusted advisor",
  biography: "Twenty years guiding buyers through premium modular living.",
};

function page(
  pageNumber: number,
  overrides: Partial<TalisBooksValidatedPage> = {},
): TalisBooksValidatedPage {
  return {
    pageNumber,
    pageRole: null,
    blocks: [],
    brokerageCompliance: null,
    ...overrides,
  };
}

function agentBrokerageBlocks(layoutSlug = "agent-brokerage-standard"): Partial<TalisBooksValidatedPage> {
  return {
    pageRole: "agent_brokerage",
    layoutSlug,
    layoutType: "single",
    brokerageCompliance: { ...COMPLIANCE },
    blocks: [
      { type: "agent" },
      { type: "brokerage" },
      { type: "broker_logo", imageId: COMPLIANCE.brokerLogoId ?? undefined },
      { type: "broker_name", value: COMPLIANCE.brokerName ?? undefined },
      { type: "agent_photo", imageId: COMPLIANCE.agentPhotoId ?? undefined },
      { type: "agent_contact", value: COMPLIANCE.agentContact ?? undefined },
      { type: "headline", value: COMPLIANCE.headline ?? undefined },
      { type: "biography", value: COMPLIANCE.biography ?? undefined },
    ],
  };
}

/**
 * Builds an official-structure book.
 * Total pages = 4 + propertyCount (cover + pages 2–3 + property + final).
 * Default propertyCount = 8 → 12 pages (official minimum).
 */
function validBookPages(propertyCount = 8): TalisBooksValidatedPage[] {
  const pages: TalisBooksValidatedPage[] = [
    page(1, { pageRole: "cover", blocks: [{ type: "cover" }] }),
    page(2, agentBrokerageBlocks()),
    page(3, agentBrokerageBlocks()),
  ];

  for (let index = 0; index < propertyCount; index += 1) {
    pages.push(
      page(4 + index, {
        pageRole: "property_content",
        blocks: [{ type: "property_content" }, { type: "property_photo", imageCategory: "property" }],
      }),
    );
  }

  const lastPageNumber = 3 + propertyCount + 1;
  pages.push(page(lastPageNumber, agentBrokerageBlocks()));

  return pages;
}

describe("validateTalisBooksPageRules", () => {
  it("accepts the official minimum 12-page structure", () => {
    const pages = validBookPages(8);
    expect(pages).toHaveLength(TALISBOOKS_MINIMUM_PAGE_COUNT);

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("accepts the official maximum 22-page structure", () => {
    const pages = validBookPages(18);
    expect(pages).toHaveLength(TALISBOOKS_MAXIMUM_PAGE_COUNT);

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("requires page 1 to be a cover", () => {
    const pages = validBookPages();
    pages[0] = page(1, { pageRole: "agent_brokerage", blocks: [{ type: "agent" }, { type: "brokerage" }] });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.COVER_PAGE_1)).toBe(
      true,
    );
  });

  it("requires brokerage and agent sections on page 2", () => {
    const pages = validBookPages();
    pages[1] = page(2, {
      pageRole: "agent_brokerage",
      brokerageCompliance: { ...COMPLIANCE },
      blocks: [{ type: "agent" }],
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.AGENT_BROKERAGE_PAGE_2),
    ).toBe(true);
  });

  it("requires complete brokerage compliance on page 2", () => {
    const pages = validBookPages();
    pages[1] = page(2, {
      ...agentBrokerageBlocks(),
      brokerageCompliance: {
        ...COMPLIANCE,
        brokerName: "",
        biography: "",
      },
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === TALISBOOKS_PAGE_RULE_CODES.BROKERAGE_COMPLIANCE_MISSING &&
          v.pageNumber === 2,
      ),
    ).toBe(true);
  });

  it("requires complete brokerage compliance on page 3", () => {
    const pages = validBookPages();
    pages[2] = page(3, {
      ...agentBrokerageBlocks(),
      brokerageCompliance: {
        ...COMPLIANCE,
        agentPhotoId: null,
      },
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === TALISBOOKS_PAGE_RULE_CODES.BROKERAGE_COMPLIANCE_MISSING &&
          v.pageNumber === 3,
      ),
    ).toBe(true);
  });

  it("never allows property images on page 2", () => {
    const pages = validBookPages();
    pages[1] = page(2, {
      ...agentBrokerageBlocks(),
      blocks: [
        { type: "agent" },
        { type: "brokerage" },
        { type: "property_photo", imageCategory: "property" },
      ],
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === TALISBOOKS_PAGE_RULE_CODES.NO_PROPERTY_PHOTOS_EARLY && v.pageNumber === 2,
      ),
    ).toBe(true);
  });

  it("never allows property images on page 3", () => {
    const pages = validBookPages();
    pages[2] = page(3, {
      ...agentBrokerageBlocks(),
      backgroundImageCategory: "property",
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === TALISBOOKS_PAGE_RULE_CODES.NO_PROPERTY_PHOTOS_EARLY && v.pageNumber === 3,
      ),
    ).toBe(true);
  });

  it("requires pages 4 through last-1 to be property content", () => {
    const pages = validBookPages();
    pages[3] = page(4, {
      pageRole: "agent_brokerage",
      brokerageCompliance: { ...COMPLIANCE },
      blocks: [{ type: "agent" }, { type: "brokerage" }],
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.INTERIOR_PROPERTY_CONTENT),
    ).toBe(true);
  });

  it("requires the final page to duplicate page 3 brokerage layout and compliance", () => {
    const pages = validBookPages();
    pages[pages.length - 1] = page(pages.length, {
      pageRole: "agent_brokerage",
      layoutSlug: "different-layout",
      brokerageCompliance: {
        ...COMPLIANCE,
        headline: "Different headline",
      },
      blocks: [{ type: "agent" }, { type: "brokerage" }],
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.LAST_PAGE_MATCHES_PAGE_3),
    ).toBe(true);
  });

  it("blocks publishing when brokerage information is missing on the final page", () => {
    const pages = validBookPages();
    pages[pages.length - 1] = page(pages.length, {
      pageRole: "agent_brokerage",
      layoutSlug: "agent-brokerage-standard",
      brokerageCompliance: {
        ...COMPLIANCE,
        agentContact: "",
      },
      blocks: [{ type: "agent" }, { type: "brokerage" }],
    });

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some(
        (v) =>
          v.code === TALISBOOKS_PAGE_RULE_CODES.BROKERAGE_COMPLIANCE_MISSING &&
          v.pageNumber === pages.length,
      ),
    ).toBe(true);
  });

  it("rejects publishing below the 12-page minimum", () => {
    const result = validateTalisBooksPageRules(validBookPages(7));

    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.MINIMUM_PAGES)).toBe(
      true,
    );
  });

  it("rejects publishing above the 22-page maximum", () => {
    const result = validateTalisBooksPageRules(validBookPages(19));

    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.MAXIMUM_PAGES)).toBe(
      true,
    );
  });

  it("requires sequential page numbering", () => {
    const pages = [
      page(1, { pageRole: "cover", blocks: [{ type: "cover" }] }),
      page(2, agentBrokerageBlocks()),
      page(3, agentBrokerageBlocks()),
      page(5, {
        pageRole: "property_content",
        blocks: [{ type: "property_content" }],
      }),
    ];

    const result = validateTalisBooksPageRules(pages);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.code === TALISBOOKS_PAGE_RULE_CODES.PAGE_SEQUENCE)).toBe(
      true,
    );
  });
});

describe("normalizeBookPagesForValidation", () => {
  it("reads page roles and blocks from book page content JSON", async () => {
    const { normalizeBookPagesForValidation } = await import("../lib/talisbooks/page-rules");
    const pages = normalizeBookPagesForValidation([
      {
        id: "page-1",
        bookId: "book-1",
        layoutId: null,
        templateId: null,
        title: "Cover",
        slug: "cover",
        pageNumber: 1,
        sortOrder: 0,
        content: {
          pageRole: "cover",
          blocks: [{ type: "cover" }],
        },
        backgroundImageId: null,
        isVisible: true,
        settings: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(pages[0]?.pageRole).toBe("cover");
    expect(pages[0]?.blocks[0]?.type).toBe("cover");
  });

  it("parses brokerage compliance from page content JSON", async () => {
    const { normalizeBookPagesForValidation } = await import("../lib/talisbooks/page-rules");
    const pages = normalizeBookPagesForValidation([
      {
        id: "page-2",
        bookId: "book-1",
        layoutId: null,
        templateId: null,
        title: "Agent",
        slug: "agent",
        pageNumber: 2,
        sortOrder: 1,
        content: {
          pageRole: "agent_brokerage",
          brokerageCompliance: COMPLIANCE,
          blocks: [{ type: "agent" }, { type: "brokerage" }],
        },
        backgroundImageId: null,
        isVisible: true,
        settings: {},
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(pages[0]?.brokerageCompliance?.brokerName).toBe(COMPLIANCE.brokerName);
    expect(pages[0]?.brokerageCompliance?.agentContact).toBe(COMPLIANCE.agentContact);
  });
});
