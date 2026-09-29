import { describe, expect, it } from "vitest";
import {
  ebookSlugFromTebUrl,
  resolveEbookListingImageUrls,
} from "../lib/talisbooks/mapsite-ebook-service";
import { DEMO_PINNED_EBOOK_HREF } from "../lib/talispros/demo-mapsite";
import { listingHeroImageUrl } from "../lib/talispros/mapsite-listing-media";
import { shouldBindMapsiteTebListing } from "../lib/talisbooks/auto-draft-ebook";

describe("shouldBindMapsiteTebListing", () => {
  it("binds TEB™ on the first created book", () => {
    expect(
      shouldBindMapsiteTebListing({ replacing: false, existingTebUrl: null }),
    ).toBe(true);
    expect(
      shouldBindMapsiteTebListing({ replacing: false, existingTebUrl: "  " }),
    ).toBe(true);
  });

  it("keeps the existing Mapsite™ TEB™ when another book is created", () => {
    expect(
      shouldBindMapsiteTebListing({
        replacing: false,
        existingTebUrl: "/talisbooks/viewer/rm22-rm22-talisbook-b1mz",
      }),
    ).toBe(false);
  });

  it("updates TEB™ when editing the existing book in place", () => {
    expect(
      shouldBindMapsiteTebListing({
        replacing: true,
        existingTebUrl: "/talisbooks/viewer/rm22-rm22-talisbook-b1mz",
      }),
    ).toBe(true);
  });
});


describe("ebookSlugFromTebUrl", () => {
  it("reads the viewer slug from a relative TEB™ url", () => {
    expect(
      ebookSlugFromTebUrl("/talisbooks/viewer/al02-al02-talisbook-cs4b"),
    ).toBe("al02-al02-talisbook-cs4b");
  });

  it("reads the viewer slug from an absolute TEB™ url", () => {
    expect(
      ebookSlugFromTebUrl(
        "https://example.com/talisbooks/viewer/al02-al02-talisbook-cs4b?x=1",
      ),
    ).toBe("al02-al02-talisbook-cs4b");
  });
});

describe("resolveEbookListingImageUrls pinned demo fallback", () => {
  it("loads pinned catalog interiors from the demo TEB™ url (not the front cover)", async () => {
    const urls = await resolveEbookListingImageUrls({
      tebUrl: DEMO_PINNED_EBOOK_HREF,
    });
    expect(urls[0]).toBe("/talisbooks/pinned/pages/page-01.jpg");
    expect(urls[1]).toBe("/talisbooks/pinned/pages/page-02.jpg");
    expect(urls).not.toContain("/talisbooks/pinned/front-cover.jpg");
    expect(listingHeroImageUrl(urls)).toBe("/talisbooks/pinned/pages/page-02.jpg");
    expect(listingHeroImageUrl(urls, { hideSecondInterior: true })).toBe(
      "/talisbooks/pinned/pages/page-03.jpg",
    );
  });
});
