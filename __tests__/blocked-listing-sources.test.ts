import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  bytesReferenceBlockedListingSource,
  descriptionReferencesBlockedListingSource,
  extractBrokerageSiteImageRefs,
  extractSameSiteContentLinks,
  isBlockedListingHost,
  isBlockedListingUrl,
  resolveBrokerageWebsiteUrl,
  resolveSystemEbookListingImages,
  sanitizeSystemEbookMetadata,
  stripRealtorCreditText,
  systemEbookPayloadMentionsBlockedSource,
  withoutBlockedListingUrls,
} from "../lib/talisbooks/blocked-listing-sources";

vi.mock("server-only", () => ({}));

import { collectBrokerageSiteListingImages } from "../lib/talisbooks/brokerage-site-listing-images";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("blocked listing hosts", () => {
  it("blocks realtor.ca and every subdomain, including the CDN", () => {
    expect(isBlockedListingHost("realtor.ca")).toBe(true);
    expect(isBlockedListingHost("www.realtor.ca")).toBe(true);
    expect(isBlockedListingHost("cdn.realtor.ca")).toBe(true);
    expect(isBlockedListingHost("images.cdn.realtor.ca")).toBe(true);
    expect(isBlockedListingHost("REALTOR.CA.")).toBe(true);
    expect(isBlockedListingHost("notrealtor.ca")).toBe(false);
    expect(isBlockedListingHost("realtor.ca.example.com")).toBe(false);
    expect(isBlockedListingHost("example.com")).toBe(false);
  });

  it("blocks listing URLs by host only", () => {
    expect(isBlockedListingUrl("https://www.realtor.ca/real-estate/1")).toBe(true);
    expect(isBlockedListingUrl("https://cdn.realtor.ca/photos/a.jpg")).toBe(true);
    expect(isBlockedListingUrl("//images.cdn.realtor.ca/a.jpg")).toBe(true);
    expect(isBlockedListingUrl("realtor.ca/listing")).toBe(true);
    expect(isBlockedListingUrl("https://example.com/out?to=https://realtor.ca/a")).toBe(false);
    expect(isBlockedListingUrl("/images/glasshouse/hero.png")).toBe(false);
    expect(isBlockedListingUrl("https://broker.example/listing.jpg")).toBe(false);
    expect(
      withoutBlockedListingUrls([
        "https://cdn.realtor.ca/a.jpg",
        "https://broker.example/hero.jpg",
      ]),
    ).toEqual(["https://broker.example/hero.jpg"]);
  });
});

describe("realtor credit text", () => {
  it("removes published-on and source lines without touching the rest", () => {
    expect(
      stripRealtorCreditText("Listings as published on REALTOR.ca, November 2026."),
    ).toBe("");
    expect(
      stripRealtorCreditText(
        "A bright kitchen. Listings as published on REALTOR®.ca, November 2026.",
      ),
    ).toBe("A bright kitchen.");
    expect(
      stripRealtorCreditText("Source: https://www.realtor.ca/real-estate/28493120"),
    ).toBe("");
    expect(
      stripRealtorCreditText(
        "Open house Saturday.\nSource: https://cdn.realtor.ca/listing/9\nCall the office.",
      ),
    ).toBe("Open house Saturday.\nCall the office.");
    expect(stripRealtorCreditText("Published by the brokerage.")).toBe(
      "Published by the brokerage.",
    );
    expect(descriptionReferencesBlockedListingSource("Kitchen with oak floors.")).toBe(
      false,
    );
    expect(
      descriptionReferencesBlockedListingSource(
        "Listings as published on REALTOR.ca, November 2026.",
      ),
    ).toBe(true);
  });
});

describe("system ebook listing images", () => {
  const brokerage = [
    { url: "https://assets.example/brokerage-site/ab01/hero.webp", width: 1600, height: 1000 },
  ];
  const existing = [
    { url: "https://assets.example/auto-draft/ab01/kept.webp", width: 1200, height: 800 },
  ];

  it("uses brokerage photos when a system upload is realtor-sourced", () => {
    const resolved = resolveSystemEbookListingImages({
      incoming: [
        { url: "https://cdn.realtor.ca/watermark.jpg", width: 1200, height: 800 },
      ],
      brokerage,
      existing,
      replaceRealtorSources: true,
    });
    expect(resolved.action).toBe("brokerage");
    expect(resolved.images).toEqual(brokerage);
    expect(JSON.stringify(resolved)).not.toMatch(/realtor\.ca|cdn\.realtor|glasshouse/i);
  });

  it("leaves the book images unchanged when the brokerage site has none", () => {
    const resolved = resolveSystemEbookListingImages({
      incoming: [{ url: "https://www.realtor.ca/a.jpg", width: 800, height: 600 }],
      brokerage: [],
      existing,
      replaceRealtorSources: true,
    });
    expect(resolved.action).toBe("unchanged");
    expect(resolved.images).toEqual(existing);
    expect(JSON.stringify(resolved)).not.toMatch(/glasshouse/i);
  });

  it("keeps a paid upload and only drops realtor.ca hosts", () => {
    const resolved = resolveSystemEbookListingImages({
      incoming: [
        { url: "https://assets.example/client.jpg", width: 1000, height: 800 },
        { url: "https://cdn.realtor.ca/x.jpg", width: 1000, height: 800 },
      ],
      brokerage,
      existing,
      replaceRealtorSources: false,
    });
    expect(resolved).toEqual({
      action: "incoming",
      images: [{ url: "https://assets.example/client.jpg", width: 1000, height: 800 }],
    });
  });

  it("never writes realtor.ca into system ebook metadata", () => {
    const metadata = sanitizeSystemEbookMetadata({
      autoGenerated: true,
      exactPdfPages: true,
      source: "self-service-pdf",
      description: "Listings as published on REALTOR.ca, November 2026.",
      galleryImageUrls: [
        "https://cdn.realtor.ca/photos/1.jpg",
        "https://assets.example/brokerage-site/ab01/hero.webp",
      ],
      coverImageUrl: "https://www.realtor.ca/real-estate/1",
      note: "Source: https://www.realtor.ca/real-estate/1",
    });
    expect(systemEbookPayloadMentionsBlockedSource(metadata)).toBe(false);
    expect(JSON.stringify(metadata)).not.toMatch(/realtor\.ca|cdn\.realtor/i);
    expect(metadata.galleryImageUrls).toEqual([
      "https://assets.example/brokerage-site/ab01/hero.webp",
    ]);
    expect(metadata).not.toHaveProperty("coverImageUrl");
  });
});

describe("brokerage website image collection", () => {
  const html = `
    <html>
      <head>
        <meta property="og:image" content="https://cdn.realtor.ca/og.jpg" />
        <meta property="og:image" content="https://www.harbourrealty.example/photos/og-hero.jpg" />
        <meta name="twitter:image" content="https://cdn.harbourrealty.example/office.jpg" />
      </head>
      <body>
        <img src="/logo.png" alt="Harbour Realty logo" width="180" height="60" />
        <img src="/icons/pin.png" class="map-icon" width="32" height="32" />
        <img src="/images/listing-front.jpg" alt="12 King Street listing" width="1600" height="1000" />
        <a href="https://www.realtor.ca/real-estate/9">MLS</a>
        <a href="/listings/12-king">Listing</a>
      </body>
    </html>
  `;

  it("keeps same-site hero, listing, and office photos", () => {
    const refs = extractBrokerageSiteImageRefs(
      html,
      "https://www.harbourrealty.example/",
    );
    expect(refs.map((ref) => ref.url)).toEqual([
      "https://www.harbourrealty.example/photos/og-hero.jpg",
      "https://cdn.harbourrealty.example/office.jpg",
      "https://www.harbourrealty.example/images/listing-front.jpg",
    ]);
    expect(extractSameSiteContentLinks(html, "https://www.harbourrealty.example/")).toEqual([
      "https://www.harbourrealty.example/listings/12-king",
    ]);
    expect(resolveBrokerageWebsiteUrl("https://www.realtor.ca/x", "https://harbourrealty.example")).toBe(
      "https://harbourrealty.example",
    );
    expect(resolveBrokerageWebsiteUrl("https://cdn.realtor.ca/a", null)).toBeNull();
  });

  it("uploads usable brokerage photos and skips realtor, logos, and tiny images", async () => {
    const uploaded: string[] = [];
    const images = await collectBrokerageSiteListingImages(
      { fastCode: "AB01", websiteUrl: "https://www.harbourrealty.example" },
      {
        fetchText: async () => ({
          html,
          finalUrl: "https://www.harbourrealty.example/",
        }),
        fetchImage: async (url) => ({
          buffer: Buffer.from(url),
          contentType: "image/jpeg",
        }),
        probeImage: async (buffer) => {
          const url = buffer.toString();
          if (url.includes("listing-front")) return { width: 1600, height: 1000 };
          if (url.includes("og-hero")) return { width: 1200, height: 800 };
          if (url.includes("office")) return { width: 40, height: 40 };
          return { width: 16, height: 16 };
        },
        uploadImage: async (input) => {
          const url = `https://assets.example/brokerage-site/ab01/${uploaded.length}.webp`;
          uploaded.push(input.buffer.toString());
          return { url, width: input.width, height: input.height };
        },
      },
    );
    expect(uploaded.every((url) => !/realtor\.ca/i.test(url))).toBe(true);
    expect(images.map((image) => image.url)).toEqual([
      "https://assets.example/brokerage-site/ab01/0.webp",
      "https://assets.example/brokerage-site/ab01/1.webp",
    ]);
    expect(JSON.stringify(images)).not.toMatch(/realtor\.ca|cdn\.realtor|glasshouse/i);
  });

  it("returns no images for a realtor.ca website and does not upload", async () => {
    const uploadImage = vi.fn();
    const images = await collectBrokerageSiteListingImages(
      { fastCode: "AB01", websiteUrl: "https://www.realtor.ca/map" },
      { uploadImage },
    );
    expect(images).toEqual([]);
    expect(uploadImage).not.toHaveBeenCalled();
  });
});

describe("listing source bytes", () => {
  it("detects realtor.ca inside a PDF byte stream", () => {
    const bytes = new TextEncoder().encode("Featured Listings Source: https://www.realtor.ca/1");
    expect(bytesReferenceBlockedListingSource(bytes)).toBe(true);
    expect(bytesReferenceBlockedListingSource(new TextEncoder().encode("Harbour Realty"))).toBe(
      false,
    );
  });
});

describe("fallback image source", () => {
  it("does not hard-code Glasshouse as the system ebook fallback", () => {
    const sources = [
      "lib/talisbooks/blocked-listing-sources.ts",
      "lib/talisbooks/brokerage-site-listing-images.ts",
    ];
    for (const path of sources) {
      expect(read(path)).not.toMatch(/glasshouse/i);
    }
    expect(read("lib/talisbooks/brokerage-site-listing-images.ts")).toContain(
      "collectBrokerageSiteListingImages",
    );
    expect(read("lib/talisbooks/brokerage-site-listing-images.ts")).toContain(
      "brokerage-site/${code}/",
    );
  });
});
