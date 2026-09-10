import { describe, expect, it, vi } from "vitest";
import {
  fallbackOptimizedDemoPages,
  fetchWithTimeout,
  loadPinnedTalisBookPageFiles,
} from "../lib/talisbooks/load-pinned-demo-pages";
import { PINNED_TALISBOOK_INTERIOR_PAGE_COUNT } from "../lib/talisbooks/library/pinned-catalog";

describe("pinned demo page extract", () => {
  it("loads every pre-rasterized interior as a JPEG File", async () => {
    const seen: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const href = String(input);
      seen.push(href);
      return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    }) as unknown as typeof fetch;

    const files = await loadPinnedTalisBookPageFiles({ fetchImpl });
    expect(files).toHaveLength(PINNED_TALISBOOK_INTERIOR_PAGE_COUNT);
    expect(files.every((file) => file.type === "image/jpeg")).toBe(true);
    expect(files[0]?.name).toBe("page-01.jpg");
    expect(files[10]?.name).toBe("page-11.jpg");
    expect(seen[0]).toBe("/talisbooks/pinned/pages/page-01.jpg");
    expect(seen[10]).toBe("/talisbooks/pinned/pages/page-11.jpg");
  });

  it("fails clearly when a pinned page cannot be fetched", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 })) as unknown as typeof fetch;
    await expect(loadPinnedTalisBookPageFiles({ fetchImpl })).rejects.toThrow(
      /Could not load page-01\.jpg/,
    );
  });

  it("aborts hung fetches instead of looping forever", async () => {
    const fetchImpl = vi.fn(
      () => new Promise<Response>(() => undefined),
    ) as unknown as typeof fetch;

    await expect(
      fetchWithTimeout("/hang", undefined, 20, fetchImpl),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("falls back to the pinned interior URLs when optimize upload is unavailable", () => {
    const pages = fallbackOptimizedDemoPages();
    expect(pages).toHaveLength(PINNED_TALISBOOK_INTERIOR_PAGE_COUNT);
    expect(pages[0]).toMatchObject({
      url: "/talisbooks/pinned/pages/page-01.jpg",
      width: 1600,
      height: 893,
    });
  });
});
