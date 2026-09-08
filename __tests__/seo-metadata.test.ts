import { describe, expect, it } from "vitest";
import { createMetadata } from "../lib/seo";

describe("createMetadata", () => {
  it("omits Open Graph and Twitter images when image is false", () => {
    const meta = createMetadata({
      title: "Mapsite™ AL02",
      description: "Talispros™ Mapsite™ for FAST Code AL02.",
      path: "/mapsite/al02",
      image: false,
    });

    expect(meta.openGraph?.images).toEqual([]);
    expect(meta.twitter).toMatchObject({
      card: "summary",
      title: "Mapsite™ AL02",
      description: "Talispros™ Mapsite™ for FAST Code AL02.",
    });
    expect(meta.twitter && "images" in meta.twitter ? meta.twitter.images : undefined).toBeUndefined();
    expect(meta.alternates?.canonical).toBe("https://www.talishouse.com/mapsite/al02");
  });
});
