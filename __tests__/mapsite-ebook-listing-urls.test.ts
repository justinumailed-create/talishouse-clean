import { describe, expect, it } from "vitest";
import { ebookSlugFromTebUrl } from "../lib/talisbooks/mapsite-ebook-service";

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
