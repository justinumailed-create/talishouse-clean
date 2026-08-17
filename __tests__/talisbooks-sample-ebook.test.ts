import { afterEach, describe, expect, it } from "vitest";
import {
  createDemoViewerBook,
  createBrokeragePage2Scaffold,
} from "../lib/talisbooks/viewer";
import {
  TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
  ensurePermanentClosingPages,
  getGlasshouseBrochureSource,
  isPermanentViewerPage,
  setGlasshouseBrochureSourceOverride,
} from "../lib/talisbooks/permanent-pages";
import {
  TALISBOOKS_MAXIMUM_PAGE_COUNT,
  TALISBOOKS_MINIMUM_PAGE_COUNT,
} from "../lib/talisbooks/page-rules/constants";
import { MAPSITE_DEMO_LOCATION } from "../lib/mapsite/demo-location";
import type { TalisBooksViewerPage } from "../lib/talisbooks/viewer/types";

describe("Sample E-Book demo book (FSBO)", () => {
  const book = createDemoViewerBook();

  it("uses the sample-ebook slug and FSBO listing profile", () => {
    expect(book.slug).toBe("sample-ebook");
    expect(book.title).toBe("Meat Cove Retreat");
    expect(book.listingProfile).toBe("fsbo");
    expect(book.viewerStyle).toBe("magazine");
  });

  it("stays within official 12–22 page bounds", () => {
    expect(book.pages.length).toBeGreaterThanOrEqual(TALISBOOKS_MINIMUM_PAGE_COUNT);
    expect(book.pages.length).toBeLessThanOrEqual(TALISBOOKS_MAXIMUM_PAGE_COUNT);
    expect(book.pages).toHaveLength(16);
  });

  it("follows FSBO cover → map → property → Glasshouse brochure → back cover", () => {
    expect(book.pages[0]?.pageRole).toBe("cover");
    expect(book.pages[1]?.layout).toBe("maps");
    expect(book.pages.some((page) => page.pageRole === "agent_brokerage")).toBe(false);

    const brochure = book.pages.filter(
      (page) => page.systemKey === TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY,
    );
    expect(brochure).toHaveLength(2);
    expect(brochure.every((page) => isPermanentViewerPage(page))).toBe(true);

    const last = book.pages.at(-1)!;
    const secondLast = book.pages.at(-2)!;
    const thirdLast = book.pages.at(-3)!;
    expect(last.pageRole).toBe("cover");
    expect(secondLast.systemKey).toBe(TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY);
    expect(thirdLast.systemKey).toBe(TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY);
    expect(last.heroImageUrl).toContain("back-cover.jpg");
  });

  it("places the demo Mapsite™ PIN on page 2", () => {
    const mapPage = book.pages[1]!;
    expect(mapPage.address).toBe(MAPSITE_DEMO_LOCATION.streetAddress);
    expect(mapPage.latitude).toBe(MAPSITE_DEMO_LOCATION.latitude);
    expect(mapPage.longitude).toBe(MAPSITE_DEMO_LOCATION.longitude);
  });

  it("omits broker branding from the FSBO demo", () => {
    const editable = book.pages.filter((page) => !isPermanentViewerPage(page));
    expect(editable.every((page) => !page.brokerageName && !page.agentName)).toBe(true);
  });

  it("joins centerfolds with one continuous spread image and one caption", () => {
    const left = book.pages.find((page) => page.layout === "centerfold_left");
    const right = book.pages.find((page) => page.layout === "centerfold_right");
    expect(left?.spreadImageUrl).toBeTruthy();
    expect(left?.spreadImageUrl).toBe(right?.spreadImageUrl);
    expect(left?.title).toBe("");
    expect(right?.title).toBeTruthy();
  });
});

describe("Permanent Glasshouse brochure pages", () => {
  afterEach(() => {
    setGlasshouseBrochureSourceOverride(null);
  });

  it("inserts brochure as the last two pages before the back cover", () => {
    const pages: TalisBooksViewerPage[] = [
      {
        id: "c",
        pageNumber: 1,
        pageRole: "cover",
        layout: "cover",
        title: "Cover",
      },
      {
        id: "p",
        pageNumber: 2,
        pageRole: "property_content",
        layout: "caption",
        title: "Story",
      },
      {
        id: "b",
        pageNumber: 3,
        pageRole: "cover",
        layout: "cover",
        title: "Back",
      },
    ];

    const ensured = ensurePermanentClosingPages(pages);
    expect(ensured).toHaveLength(5);
    expect(ensured[2]?.systemKey).toBe(TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY);
    expect(ensured[3]?.systemKey).toBe(TALISBOOKS_GLASSHOUSE_BROCHURE_SYSTEM_KEY);
    expect(ensured[4]?.title).toBe("Back");
    expect(ensured.every((page, index) => page.pageNumber === index + 1)).toBe(true);
  });

  it("applies global admin overrides to brochure assets", () => {
    setGlasshouseBrochureSourceOverride({
      left: {
        title: "Admin Glasshouse Left",
        heroImageUrl: "/admin/left.jpg",
      },
      right: {
        title: "Admin Glasshouse Right",
        heroImageUrl: "/admin/right.jpg",
      },
    });

    const source = getGlasshouseBrochureSource();
    expect(source.left.title).toBe("Admin Glasshouse Left");
    expect(source.spreadImageUrl).toBe("/admin/left.jpg");
    expect(source.right.heroImageUrl).toBe("/admin/left.jpg");
    expect(source.left.heroImageUrl).toBe(source.right.heroImageUrl);

    const pages = ensurePermanentClosingPages([
      {
        id: "c",
        pageNumber: 1,
        pageRole: "cover",
        layout: "cover",
        title: "Cover",
      },
      {
        id: "b",
        pageNumber: 2,
        pageRole: "cover",
        layout: "cover",
        title: "Back",
      },
    ]);

    expect(pages[1]?.title).toBe("Admin Glasshouse Left");
    expect(pages[2]?.title).toBe("Admin Glasshouse Right");
    expect(pages[1]?.layout).toBe("global_content");
    expect(pages[1]?.spreadImageUrl).toBe("/admin/left.jpg");
    expect(pages[2]?.spreadImageUrl).toBe(pages[1]?.spreadImageUrl);
  });

  it("keeps brokerage scaffolds available for future mode", () => {
    const page2 = createBrokeragePage2Scaffold();
    expect(page2.pageRole).toBe("agent_brokerage");
    expect(page2.layout).toBe("agent_intro");
  });
});
