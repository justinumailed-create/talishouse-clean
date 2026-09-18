import { describe, expect, it } from "vitest";
import { ebookSlugFromTebUrl } from "../lib/talisbooks/mapsite-ebook-service";
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
