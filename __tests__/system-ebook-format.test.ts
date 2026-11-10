import sharp from "sharp";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bookFrameSpreadImageUrl } from "../lib/talisbooks/viewer/spread-layout";
import {
  brokerageInitials,
  buildSystemEbook,
  chooseListingVisual,
  formatCad,
  milesToKilometres,
  parseCadAmount,
  placeFromOfficeAddress,
  polishSystemCopy,
  systemEbookLackedListingsMessage,
  talismapsStaticMapUrl,
  writeBrokerageAbout,
  writeListingBody,
  writeMarketCopy,
  SYSTEM_EBOOK_LEAF_HEIGHT,
  SYSTEM_EBOOK_LEAF_WIDTH,
  SYSTEM_EBOOK_SPREAD_ASPECT,
  type SystemEbookProfile,
} from "../lib/talisbooks/system-ebook-format";
import {
  bufferShowsCornerWatermark,
  extractBrokerageLogo,
  extractListingCandidates,
  isRejectedListingPhotoUrl,
} from "../lib/talisbooks/system-ebook-sources";
import { createSystemEbookPreview } from "../lib/talisbooks/system-ebook-previews";

const profile: SystemEbookProfile = {
  fastCode: "dw01",
  brokerageName: "The Right Choice Realty",
  brokerName: "Dave Watt",
  officeAddress: "2B-288 Union Street, Fredericton, NB E3A 1E5",
  town: "Fredericton",
  province: "New Brunswick",
  website: "https://therightchoicerealty.ca/",
  phone: "506-455-1980",
  logoUrl: "https://therightchoicerealty.ca/logo.svg",
  areas: ["Moncton"],
  latitude: 45.97,
  longitude: -66.64,
  listings: [
    {
      street: "242 Highland Avenue",
      town: "Fredericton",
      priceCad: 419900,
      facts: ["6 bedrooms", "2 bathrooms"],
      photoUrl: "https://therightchoicerealty.ca/photos/highland.jpg",
      photoFit: "cover",
    },
  ],
};

describe("standard system Talisbook", () => {
  it("keeps the 16:9 leaf frame and does not let a photo set the page size", () => {
    expect(SYSTEM_EBOOK_LEAF_WIDTH).toBe(960);
    expect(SYSTEM_EBOOK_LEAF_HEIGHT).toBe(1080);
    expect(SYSTEM_EBOOK_SPREAD_ASPECT).toBeCloseTo(16 / 9);
    const document = buildSystemEbook({
      ...profile,
      listings: [
        {
          ...profile.listings![0]!,
          photoUrl: "https://broker.example/very-wide-photo.jpg",
        },
      ],
    });
    expect(document.book.fixedPageFrame).toBe(true);
    expect(document.metadata.fixedPageFrame).toBe(true);
    expect(document.pages.some((page) => page.spreadImageUrl)).toBe(false);
    expect(
      bookFrameSpreadImageUrl(
        [
          {
            ...document.pages[0]!,
            layout: "centerfold_left",
            spreadImageUrl: "https://broker.example/portrait-800x2000.jpg",
            spreadMat: true,
          },
        ],
        true,
      ),
    ).toBeNull();
    const listing = document.pages.find((page) => page.layout === "listing");
    expect(listing?.imageFit).toBe("cover");
    expect(listing?.pricingLine).toBe("CAD 419,900");
    const cover = document.pages[0]!;
    expect(cover.composedCover).toBe(true);
    expect(cover.imageFit).toBe("cover");
  });

  it("builds cover, about, listings, market, contact, and a logo back cover", () => {
    const document = buildSystemEbook(profile);
    expect(document.pages.length % 2).toBe(0);
    expect(document.pages[0]).toMatchObject({
      layout: "cover",
      composedCover: true,
      brokerageName: "The Right Choice Realty",
      brokerageLogoUrl: "https://therightchoicerealty.ca/logo.svg",
    });
    expect(document.pages.some((page) => page.layout === "essay" && /Dave Watt/.test(page.body || ""))).toBe(
      true,
    );
    expect(document.pages.some((page) => page.layout === "listing" && page.title.includes("Highland"))).toBe(
      true,
    );
    expect(document.pages.some((page) => page.layout === "maps")).toBe(true);
    expect(document.pages.some((page) => page.layout === "contact" && page.agentName === "Dave Watt")).toBe(
      true,
    );
    expect(document.pages.some((page) => page.agentPhotoUrl)).toBe(false);
    const back = document.pages[document.pages.length - 1]!;
    expect(back.layout).toBe("cover");
    expect(back.composedCover).toBe(true);
    expect(back.brokerageLogoUrl).toContain("logo.svg");
    expect(back.body).toMatch(/Talisbook™/);
    expect(back.body).toMatch(/Tsplits™/);
    expect(document.metadata.skipPermanentPages).toBe(true);
    expect(JSON.stringify(document.pageRows)).not.toMatch(/glasshouse|realtor\.ca|TODO|TBD|placeholder/i);
  });

  it("still builds the book when the site has no listings, and says so", () => {
    const document = buildSystemEbook({ ...profile, listings: [] });
    expect(document.lackedListings).toBe(true);
    expect(document.listingCount).toBe(0);
    expect(document.pages.some((page) => page.layout === "maps")).toBe(true);
    expect(document.pages.some((page) => page.layout === "contact")).toBe(true);
    expect(document.pages[0]?.layout).toBe("cover");
    expect(document.pages.at(-1)?.layout).toBe("cover");
    expect(systemEbookLackedListingsMessage("DW01")).toBe(
      "[system-ebook] dw01: no usable listings on the brokerage website",
    );
  });

  it("keeps a CC BY credit exactly and falls back to realty initials", () => {
    const credit =
      "Photos: Quintin Soloviev / Wikimedia Commons, CC BY 4.0; Larry from Charlottetown, PEI / Wikimedia Commons, CC BY 2.0.";
    const document = buildSystemEbook({
      ...profile,
      fastCode: "kk01",
      brokerageName: "East Coast Realty",
      logoUrl: null,
      photoCredit: credit,
      townPhotoUrls: [
        "https://example.supabase.co/storage/v1/object/public/talisbooks-assets/town-photos/kk01/00.jpg",
      ],
    });
    expect(document.logoFound).toBe(false);
    expect(document.pages[0]?.brokerageLogoUrl).toMatch(/^data:image\/svg\+xml/);
    expect(brokerageInitials("East Coast Realty", "kk01")).toBe("EC");
    expect(document.pages.at(-1)?.body).toBe(credit);
  });
});

describe("system ebook copy", () => {
  it("uses CAD, kilometres, and the Talis marks", () => {
    expect(formatCad(419900)).toBe("CAD 419,900");
    expect(parseCadAmount("$419,900")).toBe(419900);
    expect(parseCadAmount("USD 419,900")).toBeNull();
    expect(milesToKilometres(10)).toBe("16 km");
    expect(polishSystemCopy("A 5 mile drive and a Mapsite™ with FAST Code™ for this Talisbook.")).toBe(
      "A 8 km drive and a Mapsite with FAST Code for this Talisbook™.",
    );
    const about = writeBrokerageAbout(profile);
    expect(about).toMatch(/Dave Watt/);
    expect(about).not.toMatch(/This Talisbook introduces|pages that follow|brokerage itself publishes/);
    expect(about).not.toMatch(/TODO|TBD|placeholder|realtor\.ca/i);
    expect(about).not.toMatch(/Mapsite™|FAST Code™/);
    expect(placeFromOfficeAddress(profile.officeAddress)).toEqual({
      town: "Fredericton",
      province: "New Brunswick",
    });
    expect(writeMarketCopy(profile)).toMatch(/80 km/);
    expect(writeMarketCopy(profile)).not.toMatch(/pin marks|circle around/i);
    const listing = writeListingBody(profile.listings![0]!, profile);
    expect(listing).not.toMatch(/figure on the brokerage|pin sits|\bCAD\b/i);
    expect(listing.split(/[.!?]/).filter((sentence) => sentence.trim()).length).toBeGreaterThanOrEqual(2);
    const svg = readFileSync("public/system-ebook-preview/dw01/logo-mark.svg", "utf8");
    const logoWidth = Number(svg.match(/viewBox="0 0 ([\d.]+)/)?.[1]);
    expect(logoWidth).toBeGreaterThan(320);
    for (const slug of ["preview-dw01-system-ebook", "preview-km01-system-ebook"]) {
      const book = createSystemEbookPreview(slug);
      const copy = (book?.pages ?? []).map((page) => page.body || "").join(" ");
      expect(copy).not.toMatch(
        /figure on the brokerage|pin sits|This Talisbook introduces|pages that follow|brokerage itself publishes/i,
      );
    }
    expect(chooseListingVisual({ photoUrl: "https://broker.example/office.jpg" }).kind).toBe(
      "brokerage-photo",
    );
    expect(chooseListingVisual({ mapImageUrl: "/maps/listing.png" }).kind).toBe("talismaps");
    expect(chooseListingVisual({ townPhotoUrl: "/town-photos/kk01/00.jpg" }).kind).toBe(
      "town-photo",
    );
    expect(
      talismapsStaticMapUrl({
        latitude: 45.97,
        longitude: -66.64,
        zoom: 12,
        width: 960,
        height: 640,
        apiKey: "test-maptiler-key",
      }),
    ).toContain("api.maptiler.com/maps/streets-v2/static/");
    expect(talismapsStaticMapUrl({
      latitude: 45.97,
      longitude: -66.64,
      zoom: 12,
      width: 960,
      height: 640,
      apiKey: "YOUR_MAPTILER_API_KEY",
    })).toBeNull();
  });
});

describe("brokerage site reading", () => {
  const html = `
    <header><img src="/images/logo.svg" alt="Harbour Realty"></header>
    <img src="/images/logo-mls.png" alt="MLS">
    <meta property="og:image" content="https://harbour.example/og.jpg">
    <p>For sale $419,900 242 Highland Avenue Fredericton 6 bedrooms 2 bathrooms 2,559 sq ft</p>
    <p>For sale $10 12 King Street by Exp Realty Fredericton</p>
    <img data-src="https://cdn.realtor.ca/highland.jpg" alt="242 Highland Avenue">
    <img data-src="https://harbour.example/photos/highland.jpg" alt="242 Highland Avenue">
    <img data-src="/images/glasshouse/hero.webp" alt="242 Highland Avenue">
  `;

  it("takes the header logo and skips the MLS mark, watermarks, and other brokerages", () => {
    expect(extractBrokerageLogo(html, "https://harbour.example/")?.url).toBe(
      "https://harbour.example/images/logo.svg",
    );
    const listings = extractListingCandidates(html, "https://harbour.example/");
    expect(listings.map((listing) => listing.street)).toEqual(["242 Highland Avenue"]);
    expect(listings[0]?.priceCad).toBe(419900);
    expect(listings[0]?.photoUrl).toBe("https://harbour.example/photos/highland.jpg");
    expect(isRejectedListingPhotoUrl("https://cdn.realtor.ca/a.jpg")).toBe(true);
    expect(isRejectedListingPhotoUrl("https://harbour.example/images/glasshouse/hero.webp")).toBe(true);
    expect(isRejectedListingPhotoUrl("https://harbour.example/realtypress/images/listing/1.jpg")).toBe(true);
  });

  it("flags corner type that looks like a board watermark", async () => {
    const width = 400;
    const height = 300;
    const flat = Buffer.alloc(width * height * 3, 90);
    const marked = Buffer.from(flat);
    for (let y = height - 28; y < height - 6; y += 1) {
      for (let x = width - 90; x < width - 8; x += 1) {
        if ((x + y) % 2 === 0) {
          const index = (y * width + x) * 3;
          marked[index] = 255;
          marked[index + 1] = 255;
          marked[index + 2] = 255;
        }
      }
    }
    const flatJpeg = await sharp(flat, { raw: { width, height, channels: 3 } }).jpeg().toBuffer();
    const markedJpeg = await sharp(marked, { raw: { width, height, channels: 3 } }).jpeg().toBuffer();
    expect(await bufferShowsCornerWatermark(flatJpeg)).toBe(false);
    expect(await bufferShowsCornerWatermark(markedJpeg)).toBe(true);
  });
});
