import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { bookFrameSpreadImageUrl } from "../lib/talisbooks/viewer/spread-layout";
import {
  brokerageInitials,
  buildSystemEbook,
  chooseListingVisual,
  formatCad,
  formatCanadianPhone,
  preferUsablePhone,
  titleCaseAddress,
  isWithinOfficeRadius,
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
  bufferNeedsDarkPlate,
  bufferShowsCornerWatermark,
  dropWatermarkedListingPhotos,
  extractBrokerageLogo,
  extractListingCandidates,
  isPlaceholderBrandImage,
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

  it("keeps a listing when the only photo is watermarked, and reads structured cards", async () => {
    const kept = await dropWatermarkedListingPhotos([
      {
        street: "242 Highland Avenue",
        town: "Fredericton",
        priceCad: 419900,
        facts: ["6 bedrooms"],
        photoUrl: "https://cdn.realtor.ca/highland.jpg",
      },
    ]);
    expect(kept.kept).toHaveLength(0);
    expect(kept.rejectedWatermarkCount).toBe(1);

    const myRealPage = `
      <span class="alt-addr">241 W 30th Street </span>
      <span class="alt-city">Battleford</span>
      <p>Residential $69,900 Bedrooms: 2 Bathrooms: 1 Floor Area: 1,526 sq. ft.</p>
    `;
    const office = extractListingCandidates(myRealPage, "https://realestatethebattlefords.ca/officelistings.html", {
      brokerageName: "Dream Realty SK",
      officeTown: "North Battleford",
    });
    expect(office.map((listing) => `${listing.street}|${listing.town}`)).toEqual([
      "241 W 30th Street|Battleford",
    ]);
    expect(office[0]?.priceCad).toBe(69900);
    expect(office[0]?.facts).toContain("2 bedrooms");

    const slider = `
      <span class="rcr-slider__title">185-33 Reynolds Street, Fredericton, New Brunswick</span>
      <span class="rcr-slider__excerpt">Listed for $234,900 two bedrooms</span>
      <span class="rcr-slider__title">764 Route 10, Noonan</span>
    `;
    const rightChoice = extractListingCandidates(slider, "https://therightchoicerealty.ca/listings/");
    expect(rightChoice.map((listing) => listing.street)).toEqual([
      "185 Reynolds Street, Unit 33",
      "764 Route 10",
    ]);
    expect(rightChoice[0]?.town).toBe("Fredericton");
    expect(rightChoice[0]?.priceCad).toBe(234900);
  });

  it("keeps only listings that have their own photo, and formats the phone", () => {
    expect(formatCanadianPhone("5064551980")).toBe("506-455-1980");
    expect(formatCanadianPhone("(506) 455-1980")).toBe("506-455-1980");
    expect(formatCanadianPhone("09908078538")).toBe("");
    expect(preferUsablePhone("09908078538", "(604) 815-4151")).toBe("604-815-4151");
    expect(preferUsablePhone("09908078538", "not-a-phone")).toBeNull();
    expect(titleCaseAddress("37861 THIRD AVENUE")).toBe("37861 Third Avenue");
    expect(titleCaseAddress("1322 Route 148")).toBe("1322 Route 148");
    const bare = writeListingBody(
      { street: "764 Route 10", town: "Noonan", priceCad: null, facts: ["3,733 sq ft"] },
      profile,
    );
    expect(bare).toMatch(/3,733 sq ft/);
    expect(bare).not.toMatch(/filed as|is a home/i);
    expect(bare.split(/[.!?]/).filter((sentence) => sentence.trim()).length).toBeGreaterThanOrEqual(2);
    const commercial = writeListingBody(
      {
        street: "37861 THIRD AVENUE",
        town: "Squamish",
        priceCad: 9250000,
        facts: ["6 bedrooms", "7 bathrooms", "9,209 sq ft", "Commercial"],
      },
      { ...profile, town: "Squamish", brokerageName: "Macdonald Realty" },
    );
    expect(commercial).toMatch(/37861 Third Avenue/);
    expect(commercial).toMatch(/commercial property/);
    expect(commercial).not.toMatch(/\ba commercial in\b/i);
    const priced = buildSystemEbook({
      ...profile,
      areaPhotoUrl: null,
      listings: [
        {
          street: "764 Route 10",
          town: "Noonan",
          priceCad: null,
          facts: ["3,733 sq ft"],
          photoUrl: "https://broker.example/route10.jpg",
        },
      ],
    });
    const routePage = priced.pages.find((page) => page.layout === "listing");
    expect(routePage?.pricingLine).toBeUndefined();
    expect(routePage?.title).toBe("764 Route 10");
    expect(priced.pages[0]?.heroImageUrl).toBe("https://broker.example/route10.jpg");
    expect(priced.pages.find((page) => page.id === "system-area")?.heroImageUrl).toBe(
      "https://broker.example/route10.jpg",
    );
    expect(priced.pages.at(-1)?.heroImageUrl).toBe("https://broker.example/route10.jpg");
    const about = writeBrokerageAbout(profile);
    expect(about).toMatch(/Union Street/);
    expect(about).toMatch(/Dave Watt/);
    expect(isWithinOfficeRadius("Esquimalt", 49.4928, -117.2948)).toBe(false);
    expect(isWithinOfficeRadius("660 Squilax Turtle Valley Road listing", 49.4928, -117.2948)).toBe(false);
    expect(isWithinOfficeRadius("Salmo", 49.4928, -117.2948)).toBe(true);
    expect(isPlaceholderBrandImage("https://realestatethebattlefords.ca/_media/custom/custom-banner-placeholder.jpg")).toBe(
      true,
    );
    const document = buildSystemEbook({
      ...profile,
      phone: "5064551980",
      townPhotoUrls: ["https://example.supabase.co/town-photos/kk01/00.jpg"],
      listings: [
        {
          street: "1 King Street",
          town: "Fredericton",
          priceCad: 100,
          facts: [],
          mapImageUrl: "/system-ebook-preview/dw01/listing-highland.png",
        },
        {
          street: "2 Queen Street",
          town: "Fredericton",
          priceCad: 200,
          facts: [],
          photoUrl: "https://broker.example/queen.jpg",
        },
      ],
    });
    const listingPages = document.pages.filter((page) => page.layout === "listing");
    expect(listingPages.map((page) => page.title)).toEqual(["2 Queen Street"]);
    expect(listingPages[0]?.heroImageUrl).toBe("https://broker.example/queen.jpg");
    expect(JSON.stringify(listingPages)).not.toMatch(/town-photos/);
    expect(document.pages.find((page) => page.layout === "contact")?.agentPhone).toBe("506-455-1980");
    const unit = extractListingCandidates(
      `<span class="alt-addr">2 777 Belleville Street </span><span class="alt-city">Victoria</span><img data-src="https://www.dfh.ca/photos/belleville.jpg">`,
      "https://www.dfh.ca/",
    );
    expect(unit[0]?.street).toBe("777 Belleville Street, Unit 2");
    expect(unit[0]?.photoUrl).toBe("https://www.dfh.ca/photos/belleville.jpg");
    const mlsPhoto = extractListingCandidates(
      `<span class="alt-addr">606 Front Street </span><span class="alt-city">Nelson</span><img data-src="https://iss-cdn.myrealpage.com/photo.jpg">`,
      "https://fairrealty.com/officelistings.html",
    );
    expect(mlsPhoto[0]?.photoUrl).toContain("myrealpage.com");
    expect(
      extractBrokerageLogo(
        `<header><img src="/_media/custom/custom-banner-placeholder.jpg"><img src="/_media/site-logo.png" alt="Dream Realty logo"></header>`,
        "https://realestatethebattlefords.ca/",
      )?.url,
    ).toBe("https://realestatethebattlefords.ca/_media/site-logo.png");
  });

  it("flags the REALTOR mark burned into a corner and treats a tiny file as watermarked", async () => {
    const width = 480;
    const height = 360;
    const plain = Buffer.alloc(width * height * 3);
    for (let index = 0; index < plain.length; index += 3) {
      const noise = (index * 17) % 36;
      plain[index] = 70 + noise;
      plain[index + 1] = 80 + (noise % 20);
      plain[index + 2] = 64 + (noise % 24);
    }
    const marked = Buffer.from(plain);
    const template = await sharp("lib/talisbooks/realtor-mark-template.png")
      .resize({ width: 72 })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < template.info.height; y += 1) {
      for (let x = 0; x < template.info.width; x += 1) {
        if (template.data[y * template.info.width + x]! > 128) continue;
        const index = ((y + 10) * width + (x + 10)) * 3;
        marked[index] = 246;
        marked[index + 1] = 246;
        marked[index + 2] = 246;
      }
    }
    const plainJpeg = await sharp(plain, { raw: { width, height, channels: 3 } }).jpeg().toBuffer();
    const markedJpeg = await sharp(marked, { raw: { width, height, channels: 3 } }).jpeg().toBuffer();
    expect(await bufferShowsCornerWatermark(plainJpeg)).toBe(false);
    expect(await bufferShowsCornerWatermark(markedJpeg)).toBe(true);
    const tiny = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#888" } }).jpeg().toBuffer();
    expect(await bufferShowsCornerWatermark(tiny)).toBe(true);
    const whiteLogo = await sharp({
      create: { width: 80, height: 40, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 50, height: 16, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
          })
            .png()
            .toBuffer(),
          left: 8,
          top: 8,
        },
      ])
      .png()
      .toBuffer();
    const darkLogo = await sharp({
      create: { width: 80, height: 40, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 1 } },
    })
      .png()
      .toBuffer();
    expect(await bufferNeedsDarkPlate(whiteLogo)).toBe(true);
    expect(await bufferNeedsDarkPlate(darkLogo)).toBe(false);
    const tesseract = spawnSync("tesseract", ["--version"]);
    if (tesseract.status === 0) {
      const mls = await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">
            <rect width="480" height="360" fill="#6d7b4e"/>
            <text x="250" y="340" font-family="Liberation Sans" font-size="32" font-weight="700" fill="white">SASK MLS</text>
          </svg>`,
        ),
      )
        .jpeg()
        .toBuffer();
      expect(await bufferShowsCornerWatermark(mls)).toBe(true);
    }
  });
});
