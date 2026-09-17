import { describe, expect, it } from "vitest";
import {
  isPartingShotPage,
  pickPartingShotImageUrl,
  type PartingShotPage,
} from "../lib/talisbooks/parting-shot";
import { RM22_DESIGN_COMPS } from "../lib/talisbooks/rm22-template";
import { ebookPageMediaFromRow } from "../lib/talisbooks/mapsite-ebook-service";
import {
  isLargeBrandLogoUrl,
  isUsableMapSiteOgImage,
  MAPSITE_OG_BRAND_MARK,
  mapsiteOgMetadataImage,
  selectMapSiteOgImageUrl,
  toAbsoluteHttpsOgUrl,
} from "../lib/talispros/mapsite-og-image";
import { createMetadata } from "../lib/seo";

const LG02_TREE =
  "https://cdn.example/talisbooks/lg02-lg02-talisbook-4jmz/parting-tree.webp";
const LG02_COVER =
  "https://cdn.example/talisbooks/lg02-lg02-talisbook-4jmz/cover.webp";
const LG02_PRODUCT =
  "https://cdn.example/talisbooks/lg02-lg02-talisbook-4jmz/product-sheet.webp";
const PIN_PHOTO = "https://cdn.example/mapsites/lg02/pin-photo.webp";

function page(
  overrides: PartingShotPage & { pageNumber: number },
): PartingShotPage {
  return overrides;
}

const lg02Pages: PartingShotPage[] = [
  page({
    pageNumber: 1,
    pageRole: "cover",
    layout: "cover",
    heroImageUrl: LG02_COVER,
  }),
  page({
    pageNumber: 2,
    layout: "centerfold_left",
    spreadImageUrl: LG02_PRODUCT,
  }),
  page({
    pageNumber: 3,
    layout: "centerfold_right",
    spreadImageUrl: LG02_PRODUCT,
  }),
  page({
    pageNumber: 20,
    slug: "interior-10-outro-left",
    layout: "centerfold_left",
    title: "The Parting Shot…!",
    spreadImageUrl: LG02_TREE,
  }),
  page({
    pageNumber: 21,
    slug: "interior-10-outro-right",
    layout: "centerfold_right",
    title: "Outro Page",
    spreadImageUrl: LG02_TREE,
  }),
  page({
    pageNumber: 22,
    pageRole: "cover",
    layout: "cover",
    heroImageUrl: "https://cdn.example/lg02-back.webp",
  }),
];

describe("parting shot page detection", () => {
  it("recognizes RM22 outro copy, layout, and filename", () => {
    expect(
      isPartingShotPage({
        title: "The Parting Shot…!",
        layout: "centerfold_right",
      }),
    ).toBe(true);
    expect(isPartingShotPage({ layout: "parting" })).toBe(true);
    expect(isPartingShotPage({ pageRole: "outro" })).toBe(true);
    expect(
      isPartingShotPage({
        slug: "interior-10-outro-left",
        layout: "centerfold_left",
      }),
    ).toBe(true);
    expect(
      isPartingShotPage({
        title: "Welcome…!",
        layout: "centerfold_left",
      }),
    ).toBe(false);
  });

  it("picks the LG02 tree outro, not the cover or product sheet", () => {
    expect(pickPartingShotImageUrl(lg02Pages)).toBe(LG02_TREE);
  });

  it("uses the last interior before the back cover when titles are empty", () => {
    expect(
      pickPartingShotImageUrl([
        page({
          pageNumber: 1,
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: LG02_COVER,
        }),
        page({
          pageNumber: 2,
          layout: "centerfold_left",
          spreadImageUrl: LG02_PRODUCT,
        }),
        page({
          pageNumber: 20,
          layout: "centerfold_left",
          spreadImageUrl: LG02_TREE,
        }),
        page({
          pageNumber: 21,
          layout: "centerfold_right",
          spreadImageUrl: LG02_TREE,
        }),
        page({
          pageNumber: 22,
          layout: "global_content",
          systemKey: "glasshouse_brochure",
          spreadImageUrl: "/images/glasshouse/hero.png",
        }),
        page({
          pageNumber: 23,
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: "https://cdn.example/back.webp",
        }),
      ]),
    ).toBe(LG02_TREE);
  });

  it("prefers an explicit parting layout over an earlier outro-named leaf", () => {
    expect(
      pickPartingShotImageUrl([
        page({
          pageNumber: 8,
          title: "Outro Page",
          spreadImageUrl: "https://cdn.example/old-outro.webp",
        }),
        page({
          pageNumber: 13,
          layout: "parting",
          heroImageUrl: LG02_TREE,
        }),
        page({
          pageNumber: 14,
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: "https://cdn.example/back.webp",
        }),
      ]),
    ).toBe(LG02_TREE);
  });
});

describe("ebookPageMediaFromRow", () => {
  it("prefers content title and spread image for an RM22 outro leaf", () => {
    expect(
      ebookPageMediaFromRow({
        page_number: 21,
        slug: "interior-10-outro-right",
        title: "Spread 21",
        content: {
          pageRole: "property_content",
          layout: "centerfold_right",
          title: "The Parting Shot…!",
          spreadImageUrl: LG02_TREE,
        },
      }),
    ).toMatchObject({
      pageNumber: 21,
      slug: "interior-10-outro-right",
      title: "The Parting Shot…!",
      layout: "centerfold_right",
      spreadImageUrl: LG02_TREE,
    });
  });
});

describe("Mapsite™ OG image selection", () => {
  it("never uses the large Talispros™ poster or /logo.png", () => {
    expect(isLargeBrandLogoUrl("/seo/talispros-og.jpg")).toBe(true);
    expect(isLargeBrandLogoUrl("/logo.png")).toBe(true);
    expect(isLargeBrandLogoUrl("/api/og/talispros")).toBe(true);
    expect(isUsableMapSiteOgImage("/seo/talispros-og.jpg")).toBe(false);
    expect(
      selectMapSiteOgImageUrl({
        fallbackImageUrls: ["/seo/talispros-og.jpg", "/logo.png"],
      }),
    ).toBe(MAPSITE_OG_BRAND_MARK);
  });

  it("prefers the linked ebook parting shot over a mapsite pin photo", () => {
    expect(
      selectMapSiteOgImageUrl({
        pages: lg02Pages,
        coverImageUrl: LG02_COVER,
        fallbackImageUrls: [PIN_PHOTO, "/seo/talispros-og.jpg"],
      }),
    ).toBe(LG02_TREE);
  });

  it("falls back to a mapsite pin photo when the outro is still the lime template", () => {
    expect(
      selectMapSiteOgImageUrl({
        pages: [
          page({
            pageNumber: 20,
            title: "The Parting Shot…!",
            layout: "centerfold_left",
            spreadImageUrl: RM22_DESIGN_COMPS.outro,
          }),
        ],
        fallbackImageUrls: ["/seo/talispros-og.jpg", PIN_PHOTO],
      }),
    ).toBe(PIN_PHOTO);
  });

  it("falls back to the ebook cover, then a small brand mark", () => {
    expect(
      selectMapSiteOgImageUrl({
        coverImageUrl: LG02_COVER,
        fallbackImageUrls: ["/logo.png"],
      }),
    ).toBe(LG02_COVER);
    expect(selectMapSiteOgImageUrl({})).toBe(MAPSITE_OG_BRAND_MARK);
  });

  it("emits absolute HTTPS Open Graph URLs for WhatsApp", () => {
    expect(toAbsoluteHttpsOgUrl(LG02_TREE)).toBe(LG02_TREE);
    expect(toAbsoluteHttpsOgUrl("http://cdn.example/tree.webp")).toBe(
      "https://cdn.example/tree.webp",
    );
    const image = mapsiteOgMetadataImage(LG02_TREE, "Mapsite™ LG02");
    expect(image.url).toBe(LG02_TREE);
    const meta = createMetadata({
      title: "Mapsite™ LG02",
      description: "Talispros™ Mapsite™ for FAST Code LG02.",
      path: "/talispros/mapsite/root/lg02",
      image,
    });
    expect(meta.openGraph?.images).toEqual([
      {
        url: LG02_TREE,
        width: 1200,
        height: 630,
        alt: "Mapsite™ LG02",
      },
    ]);
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [LG02_TREE],
    });
  });
});
