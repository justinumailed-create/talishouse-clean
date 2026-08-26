import { describe, expect, it } from "vitest";
import { getGlasshouseBrochureSource } from "@/lib/talisbooks/permanent-pages/glasshouse-brochure";
import {
  assignFacingUploadRoles,
  buildSelfServiceEbookPageRows,
  isSelfServiceSpreadCandidate,
  parseSelfServiceBookOptions,
  parseSelfServiceCaptions,
  selfServicePageCount,
  SELF_SERVICE_BOTH_CONTENT_TOTAL_PAGES,
  SELF_SERVICE_DEFAULT_TOTAL_PAGES,
  SELF_SERVICE_LOT_PAGE,
  SELF_SERVICE_MAX_UPLOAD_IMAGES,
  type SelfServiceBookOptions,
} from "@/lib/talisbooks/self-service-page-plan";
import { isMattedSpreadPage } from "@/lib/talisbooks/viewer/spread-layout";

const portrait = (n: number) => ({
  url: `https://cdn.example/portrait-${n}.jpg`,
  width: 1200,
  height: 1800,
});

const landscape = (n: number) => ({
  url: `https://cdn.example/landscape-${n}.jpg`,
  width: 2400,
  height: 1200,
});

const baseInput = {
  title: "Cliff Lot",
  description: "Oceanfront acreage.",
  location: "Meat Cove, NS",
  coverImageUrl: "https://cdn.example/cover.jpg",
  backCoverImageUrl: "https://cdn.example/back.jpg",
  agent: {
    name: "Alex Owner",
    phone: "902-555-0100",
    email: "alex@example.com",
    brokerageName: "Owner Listing",
    brokerageLogoUrl: "https://cdn.example/logo.png",
  },
};

function options(
  partial: Partial<SelfServiceBookOptions> = {},
): SelfServiceBookOptions {
  return {
    facingPages: true,
    captions: false,
    advertising: false,
    globalContent: false,
    customContent: false,
    ...partial,
  };
}

describe("self-service ebook page plan (facing spreads)", () => {
  it("uses image #1 as cover spread; remaining images are interiors", () => {
    expect(SELF_SERVICE_MAX_UPLOAD_IMAGES).toBe(20);
    const uploads = [
      { url: "https://cdn.example/cover-spread.jpg", width: 2400, height: 1200 },
      { url: "https://cdn.example/portrait-early.jpg", width: 1200, height: 1800 },
      { url: "https://cdn.example/interior-1.jpg", width: 1600, height: 1200 },
      { url: "https://cdn.example/interior-2.jpg", width: 1200, height: 1800 },
      ...Array.from({ length: 18 }, (_, i) => ({
        url: `https://cdn.example/extra-${i + 1}.jpg`,
        width: 1600,
        height: 1200,
      })),
    ];
    const roles = assignFacingUploadRoles(uploads);
    expect(roles.coverSpreadImageUrl).toBe("https://cdn.example/cover-spread.jpg");
    expect(roles.coverImageUrl).toBe("https://cdn.example/cover-spread.jpg");
    expect(roles.backCoverImageUrl).toBe("https://cdn.example/cover-spread.jpg");
    expect(roles.landscapes[0]?.url).toBe("https://cdn.example/portrait-early.jpg");
    expect(roles.landscapes[1]?.url).toBe("https://cdn.example/interior-1.jpg");
    expect(roles.landscapes).toHaveLength(18);
  });

  it("still treats a portrait first image as the cover wrap (split later)", () => {
    const roles = assignFacingUploadRoles([
      { url: "https://cdn.example/p1.jpg", width: 1000, height: 1400 },
      { url: "https://cdn.example/p2.jpg", width: 1000, height: 1400 },
    ]);
    expect(roles.coverSpreadImageUrl).toBe("https://cdn.example/p1.jpg");
    expect(roles.coverImageUrl).toBe("https://cdn.example/p1.jpg");
    expect(roles.backCoverImageUrl).toBe("https://cdn.example/p1.jpg");
    expect(roles.landscapes).toHaveLength(1);
    expect(roles.landscapes[0]?.url).toBe("https://cdn.example/p2.jpg");
  });

  it("TEST 1: landscape image becomes one two-page spread without duplicating the photo", () => {
    expect(isSelfServiceSpreadCandidate(2400, 1200)).toBe(true);
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1)],
      options: options(),
    });
    expect(rows).toHaveLength(SELF_SERVICE_DEFAULT_TOTAL_PAGES);
    const left = rows.find((r) => r.page_number === 2);
    const right = rows.find((r) => r.page_number === 3);
    expect(left?.content.layout).toBe("centerfold_left");
    expect(right?.content.layout).toBe("centerfold_right");
    expect(left?.content.spreadImageUrl).toBe(landscape(1).url);
    expect(right?.content.spreadImageUrl).toBe(landscape(1).url);
    expect(left?.content.heroImageUrl).toBeUndefined();
    expect(right?.content.heroImageUrl).toBeUndefined();
    expect(left?.content.spreadMat).toBe(true);
    expect(isMattedSpreadPage(left!.content as never)).toBe(true);
    expect(isMattedSpreadPage(right!.content as never)).toBe(true);
  });

  it("TEST 2: portrait image occupies one single page", () => {
    expect(isSelfServiceSpreadCandidate(1200, 1800)).toBe(false);
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [portrait(1)],
      options: options(),
    });
    const page = rows.find((r) => r.page_number === 2);
    expect(page?.content.layout).toBe("facing");
    expect(page?.content.layoutType).toBe("single");
    expect(page?.content.heroImageUrl).toBe(portrait(1).url);
    expect(page?.content.spreadImageUrl).toBeUndefined();
    expect(rows.find((r) => r.page_number === 3)?.content.heroImageUrl).toBeUndefined();
  });

  it("TEST 3: landscape + caption is one spread with one caption string (left-leaf template)", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1)],
      options: options({ captions: true }),
      captions: [{ text: "West ridge at dusk", skipped: false }],
    });
    const left = rows.find((r) => r.page_number === 2);
    const right = rows.find((r) => r.page_number === 3);
    expect(left?.content.captionsEnabled).toBe(true);
    expect(right?.content.captionsEnabled).toBe(true);
    expect(left?.content.title).toBe("West ridge at dusk");
    expect(right?.content.title).toBe("West ridge at dusk");
    expect(left?.content.spreadImageUrl).toBe(right?.content.spreadImageUrl);
  });

  it("TEST 4: portrait + caption sits on that single page", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [portrait(1)],
      options: options({ captions: true }),
      captions: [{ text: "Entry hall", skipped: false }],
    });
    const page = rows.find((r) => r.page_number === 2);
    expect(page?.content.layout).toBe("facing");
    expect(page?.content.title).toBe("Entry hall");
    expect(page?.content.captionsEnabled).toBe(true);
    expect(page?.content.captionSkipped).toBe(false);
  });

  it("TEST 5: skipped landscape caption keeps the reserved band", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1)],
      options: options({ captions: true }),
      captions: [{ text: "", skipped: true }],
    });
    const left = rows.find((r) => r.page_number === 2);
    const right = rows.find((r) => r.page_number === 3);
    expect(left?.content.captionSkipped).toBe(true);
    expect(right?.content.captionSkipped).toBe(true);
    expect(left?.content.captionsEnabled).toBe(true);
    expect(right?.content.title).toBe("");
    expect(left?.content.spreadImageUrl).toBe(landscape(1).url);
  });

  it("TEST 6: each landscape becomes its own independent spread", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1), landscape(2), landscape(3)],
      options: options(),
    });
    const spreads = [
      [2, 3, landscape(1).url],
      [4, 5, landscape(2).url],
      [6, 7, landscape(3).url],
    ] as const;
    for (const [leftPage, rightPage, url] of spreads) {
      const left = rows.find((r) => r.page_number === leftPage);
      const right = rows.find((r) => r.page_number === rightPage);
      expect(left?.content.spreadImageUrl).toBe(url);
      expect(right?.content.spreadImageUrl).toBe(url);
      expect(left?.content.layout).toBe("centerfold_left");
      expect(right?.content.layout).toBe("centerfold_right");
    }
    expect(rows.find((r) => r.page_number === 2)?.content.spreadImageUrl).not.toBe(
      rows.find((r) => r.page_number === 4)?.content.spreadImageUrl,
    );
  });

  it("TEST 7: mixed portrait and landscape pack as page / spread / page / spread", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [portrait(1), landscape(2), portrait(3), landscape(4)],
      options: options({ captions: true }),
      captions: [
        { text: "A", skipped: false },
        { text: "B", skipped: false },
        { text: "C", skipped: false },
        { text: "D", skipped: false },
      ],
    });
    const p2 = rows.find((r) => r.page_number === 2);
    expect(p2?.content.layout).toBe("facing");
    expect(p2?.content.heroImageUrl).toBe(portrait(1).url);
    expect(p2?.content.title).toBe("A");

    // Portrait on left leaf (page 2); next landscape must start on the next left leaf (page 4)
    // after padding the odd right leaf (page 3).
    const p3 = rows.find((r) => r.page_number === 3);
    expect(p3?.content.layout).toBe("facing");
    expect(p3?.content.heroImageUrl).toBeUndefined();

    const p4 = rows.find((r) => r.page_number === 4);
    const p5 = rows.find((r) => r.page_number === 5);
    expect(p4?.content.layout).toBe("centerfold_left");
    expect(p5?.content.layout).toBe("centerfold_right");
    expect(p4?.content.spreadImageUrl).toBe(landscape(2).url);
    expect(p5?.content.spreadImageUrl).toBe(landscape(2).url);
    expect(p5?.content.title).toBe("B");

    const p6 = rows.find((r) => r.page_number === 6);
    expect(p6?.content.layout).toBe("facing");
    expect(p6?.content.heroImageUrl).toBe(portrait(3).url);
    expect(p6?.content.title).toBe("C");

    const p7 = rows.find((r) => r.page_number === 7);
    expect(p7?.content.layout).toBe("facing");
    expect(p7?.content.heroImageUrl).toBeUndefined();

    const p8 = rows.find((r) => r.page_number === 8);
    const p9 = rows.find((r) => r.page_number === 9);
    expect(p8?.content.layout).toBe("centerfold_left");
    expect(p9?.content.layout).toBe("centerfold_right");
    expect(p8?.content.spreadImageUrl).toBe(landscape(4).url);
    expect(p9?.content.spreadImageUrl).toBe(landscape(4).url);
    expect(p9?.content.title).toBe("D");
  });

  it("TEST 8: generated spread metadata matches the viewer matted-spread contract", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1)],
      options: options(),
    });
    const left = rows.find((r) => r.page_number === 2)!.content;
    const right = rows.find((r) => r.page_number === 3)!.content;
    expect(isMattedSpreadPage(left as never)).toBe(true);
    expect(isMattedSpreadPage(right as never)).toBe(true);
    expect(left.spreadImageUrl).toBe(right.spreadImageUrl);
    expect(left.layout).toBe("centerfold_left");
    expect(right.layout).toBe("centerfold_right");
  });

  it("keeps 20 pages without blank endpapers; cover/back stay art-only", () => {
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1), portrait(2)],
      options: options(),
    });
    expect(selfServicePageCount(options())).toBe(SELF_SERVICE_DEFAULT_TOTAL_PAGES);
    expect(rows).toHaveLength(SELF_SERVICE_DEFAULT_TOTAL_PAGES);
    expect(rows.find((r) => r.page_number === SELF_SERVICE_LOT_PAGE)?.content.layout).toBe(
      "cover",
    );
    expect(rows.find((r) => r.page_number === SELF_SERVICE_LOT_PAGE)?.content.exactPdfPage).toBe(
      true,
    );
    const back = rows.find((r) => r.page_number === SELF_SERVICE_DEFAULT_TOTAL_PAGES)?.content;
    expect(back?.layout).toBe("cover");
    expect(back?.pageRole).toBe("cover");
    expect(back?.exactPdfPage).toBe(true);
    expect(back?.heroImageUrl).toBe(baseInput.backCoverImageUrl);
    expect(rows.some((r) => String(r.slug).startsWith("endpaper"))).toBe(false);
  });

  it("places custom content on pages 2–3 and global Glasshouse on the inside back", () => {
    const glasshouse = getGlasshouseBrochureSource();
    const rows = buildSelfServiceEbookPageRows({
      ...baseInput,
      landscapes: [landscape(1)],
      options: options({
        customContent: true,
        globalContent: true,
        advertising: true,
      }),
    });
    expect(selfServicePageCount(options({ customContent: true, globalContent: true }))).toBe(
      SELF_SERVICE_BOTH_CONTENT_TOTAL_PAGES,
    );
    expect(rows).toHaveLength(24);
    expect(rows.find((r) => r.page_number === 2)?.content.layout).toBe("custom_content");
    expect(rows.find((r) => r.page_number === 4)?.content.layout).toBe("centerfold_left");
    expect(rows.find((r) => r.page_number === 22)?.content.layout).toBe("global_content");
    expect(rows.find((r) => r.page_number === 22)?.content.spreadImageUrl).toBe(
      glasshouse.spreadImageUrl,
    );
    expect(rows.find((r) => r.page_number === 23)?.content.spreadImageUrl).toBe(
      glasshouse.spreadImageUrl,
    );
    expect(rows.find((r) => r.page_number === 22)?.content.heroImageUrl).toBe(
      rows.find((r) => r.page_number === 23)?.content.heroImageUrl,
    );
    expect(rows.find((r) => r.page_number === 22)?.content.pricingLine).toBe(
      glasshouse.pricingLine,
    );
  });

  it("parses book options and captions from JSON", () => {
    expect(parseSelfServiceBookOptions("")).toMatchObject({
      facingPages: true,
      captions: false,
    });
    expect(
      parseSelfServiceCaptions(
        JSON.stringify([{ text: "Hi", skipped: false }, { skipped: true }]),
      ),
    ).toEqual([
      { text: "Hi", skipped: false },
      { text: "", skipped: true },
    ]);
  });
});
