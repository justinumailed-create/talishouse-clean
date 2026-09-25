import { describe, expect, it } from "vitest";
import {
  isPartingShotPage,
  pickPartingShotImageUrl,
  type PartingShotPage,
} from "../lib/talisbooks/parting-shot";
import { RM22_DESIGN_COMPS } from "../lib/talisbooks/rm22-template";
import { ebookPageMediaFromRow } from "../lib/talisbooks/mapsite-ebook-service";
import { talisbooksViewerShareOgPath } from "../lib/share/og-card";
import {
  allpinsSeoCopy,
  isLargeBrandLogoUrl,
  isUsableMapSiteOgImage,
  mapsiteOgMetadataImage,
  mapsiteRealtimeSeoCopy,
  resolveMapSiteOgImage,
  selectMapsiteScenicBackgroundUrl,
  selectViewerPartingShotUrl,
  toAbsoluteHttpsOgUrl,
  viewerRealtimeSeoCopy,
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

describe("Mapsite™ and viewer share image selection", () => {
  it("never uses the large Talispros™ poster or /logo.png as the scenic layer", () => {
    expect(isLargeBrandLogoUrl("/seo/talispros-og.jpg")).toBe(true);
    expect(isLargeBrandLogoUrl("/logo.png")).toBe(true);
    expect(isLargeBrandLogoUrl("/api/og/talispros")).toBe(true);
    expect(isUsableMapSiteOgImage("/seo/talispros-og.jpg")).toBe(false);
    expect(
      selectMapsiteScenicBackgroundUrl({
        fallbackImageUrls: ["/seo/talispros-og.jpg", "/logo.png"],
      }),
    ).toBeNull();
  });

  it("allows LRG1 gallery frames as real listing images", () => {
    expect(isUsableMapSiteOgImage("/images/mapsites/lrg1-gallery/02.png")).toBe(
      true,
    );
    expect(isUsableMapSiteOgImage("/images/glasshouse/hero.png")).toBe(false);
    expect(
      selectMapsiteScenicBackgroundUrl({
        fallbackImageUrls: ["/images/mapsites/lrg1-gallery/02.png"],
      }),
    ).toBe("/images/mapsites/lrg1-gallery/02.png");
  });

  it("prefers the linked ebook parting shot over a mapsite pin photo", () => {
    expect(
      selectMapsiteScenicBackgroundUrl({
        pages: lg02Pages,
        fallbackImageUrls: [PIN_PHOTO, "/seo/talispros-og.jpg", LG02_COVER],
      }),
    ).toBe(LG02_TREE);
  });

  it("falls back to a mapsite pin photo when the outro is still the lime template", () => {
    expect(
      selectMapsiteScenicBackgroundUrl({
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

  it("does not use the ebook cover when no parting shot or listing photo exists", () => {
    expect(
      selectMapsiteScenicBackgroundUrl({
        pages: [
          page({
            pageNumber: 1,
            pageRole: "cover",
            layout: "cover",
            heroImageUrl: LG02_COVER,
          }),
        ],
      }),
    ).toBeNull();
    expect(selectMapsiteScenicBackgroundUrl({})).toBeNull();
    expect(selectViewerPartingShotUrl(lg02Pages)).toBe(LG02_TREE);
    expect(
      selectViewerPartingShotUrl([
        page({
          pageNumber: 1,
          pageRole: "cover",
          layout: "cover",
          heroImageUrl: LG02_COVER,
        }),
      ]),
    ).toBeNull();
  });

  it("builds the live WhatsApp title and description Mapsite™ metadata uses", () => {
    expect(
      mapsiteRealtimeSeoCopy({
        fastCode: "rm22",
        propertyTitle: "Ralf Meyer",
        propertyDescription: "160 Macs Rd, Richmond County.",
      }),
    ).toEqual({
      title: "Ralf Meyer | Mapsite™",
      description: "160 Macs Rd, Richmond County.",
    });
    expect(
      mapsiteRealtimeSeoCopy({
        fastCode: "rm22",
        propertyTitle: null,
        propertyDescription: null,
        propertyAddress: "160 Macs Rd, Richmond County",
      }),
    ).toEqual({
      title: "RM22 | Mapsite™",
      description: "160 Macs Rd, Richmond County · FAST Code RM22",
    });
    expect(
      mapsiteRealtimeSeoCopy({
        fastCode: "rm22",
        propertyTitle: null,
        propertyDescription: null,
      }),
    ).toEqual({
      title: "RM22 | Mapsite™",
      description: "Mapsite™ for FAST Code RM22.",
    });
  });

  it("uses ALLPINS property copy for the multi-pin listings share card", () => {
    expect(allpinsSeoCopy()).toEqual({
      title: "ALLPINS — Every Mapsite™ | Mapsite™",
      description:
        "Canada showcase of Mapsite™ pins. Open a pin for the book and Mapsite™ demo.",
    });
    expect(resolveMapSiteOgImage("allpins")).toBe(
      "https://www.talispros.com/api/og/mapsite/allpins",
    );
  });

  it("composes viewer SEO from title, address, and FAST Code", () => {
    expect(
      viewerRealtimeSeoCopy({
        title: "Chaga Town",
        subtitle: "A lookbook for DC02",
      }),
    ).toEqual({
      title: "Chaga Town",
      description: "A lookbook for DC02",
    });
    expect(
      viewerRealtimeSeoCopy({
        title: "Chaga Town",
        address: "Ottawa, ON",
        fastCode: "dc02",
      }),
    ).toEqual({
      title: "Chaga Town",
      description: "Ottawa, ON · Talisbook™ for FAST Code DC02",
    });
  });

  it("emits the composed landscape share-card URL for Mapsite™ and viewer links", () => {
    expect(toAbsoluteHttpsOgUrl(LG02_TREE)).toBe(LG02_TREE);
    expect(toAbsoluteHttpsOgUrl("http://cdn.example/tree.webp")).toBe(
      "https://cdn.example/tree.webp",
    );

    const mapsiteImage = mapsiteOgMetadataImage(
      resolveMapSiteOgImage("dc02"),
      "Mapsite™ DC02",
    );
    expect(mapsiteImage).toEqual({
      url: "https://www.talispros.com/api/og/mapsite/dc02",
      width: 1200,
      height: 630,
      alt: "Mapsite™ DC02",
    });
    expect(mapsiteImage.url).not.toContain(LG02_TREE);
    expect(mapsiteImage.url).not.toContain("/logo.png");
    expect(mapsiteImage.url).not.toContain("talispros-og");

    const viewerUrl = toAbsoluteHttpsOgUrl(
      talisbooksViewerShareOgPath("dc02-dc02-talisbook-kc9h"),
    );
    const viewerImage = mapsiteOgMetadataImage(viewerUrl, "Chaga Town");
    expect(viewerImage).toEqual({
      url: "https://www.talispros.com/api/og/talisbooks/dc02-dc02-talisbook-kc9h",
      width: 1200,
      height: 630,
      alt: "Chaga Town",
    });

    const meta = createMetadata({
      title: "Mapsite™ DC02",
      description: "Talispros™ Mapsite™ for FAST Code DC02.",
      path: "/talispros/mapsite/fsbos/dc02",
      image: mapsiteImage,
    });
    expect(meta.openGraph?.images).toEqual([mapsiteImage]);
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [mapsiteImage.url],
    });
  });
});
