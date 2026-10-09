import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import {
  isIssuedConnectedFastCode,
  TALISBOOKS_SAMCART_REGISTER_URL,
  talisBooksShelfCta,
  talisBooksShelfShowBack,
  talisBooksViewerCta,
  talisBooksViewerShowBack,
} from "../lib/talisbooks/cta-mode";
import { PINNED_TALISBOOK_SLUG } from "../lib/talisbooks/library/pinned-catalog";

describe("Talisbooks Claim vs Register vs Back", () => {
  it("never shows Back to Mapsite on shelves (demo or issued)", () => {
    expect(talisBooksShelfShowBack("demo-abc123")).toBe(false);
    expect(talisBooksShelfShowBack("rm22")).toBe(false);
    expect(talisBooksShelfShowBack("")).toBe(false);
    expect(talisBooksShelfShowBack(null)).toBe(false);
  });

  it("uses SamCart register destination for issued connected surfaces", () => {
    expect(TALISBOOKS_SAMCART_REGISTER_URL).toContain(
      "talispros.mysamcart.com/checkout/register",
    );
    expect(isIssuedConnectedFastCode("rm22")).toBe(true);
    expect(isIssuedConnectedFastCode("demo-abc123")).toBe(false);
    expect(isIssuedConnectedFastCode("")).toBe(false);
  });

  it("shows Claim (not Register) on demo ebook / demo FAST shelf", () => {
    expect(
      talisBooksViewerCta({ slug: PINNED_TALISBOOK_SLUG, fastCode: null }),
    ).toBe("claim");
    expect(
      talisBooksViewerCta({
        fastCode: "demo-abc123",
        title: "Demo Mapsite",
      }),
    ).toBe("claim");
    expect(talisBooksShelfCta("demo-abc123")).toBe("claim");
    // Back to Mapsite is removed from every ebook viewer (blue navbar instead).
    expect(talisBooksViewerShowBack({ slug: PINNED_TALISBOOK_SLUG })).toBe(
      false,
    );
    expect(talisBooksShelfShowBack("demo-abc123")).toBe(false);
  });

  it("shows Register only (no Back) on issued FAST ebook viewers", () => {
    expect(talisBooksViewerCta({ fastCode: "rm22", slug: "rm22-book" })).toBe(
      "register",
    );
    expect(
      talisBooksViewerShowBack({ fastCode: "rm22", slug: "rm22-book" }),
    ).toBe(false);
    expect(talisBooksShelfCta("rm22")).toBe("register");
    expect(talisBooksShelfShowBack("rm22")).toBe(false);
  });

  it("wires viewer + shelf shells to Claim / Register / Back helpers", () => {
    const viewer = readFileSync(
      resolve("components/talisbooks/viewer/TalisBooksViewerShell.tsx"),
      "utf8",
    );
    const library = readFileSync(
      resolve("components/talisbooks/library/TalisBooksLibraryShell.tsx"),
      "utf8",
    );

    expect(viewer).toContain("talisBooksViewerCta");
    expect(viewer).toContain("DemoClaimMarketButton");
    // No Back to Mapsite and no stray SamCart Register on the ebook page.
    expect(viewer).not.toContain("tv.backToMapsite");
    expect(viewer).not.toContain("viewerBackToMapsiteHref");
    expect(viewer).not.toContain("tv.continueToRegister");
    expect(viewer).not.toContain("TALISBOOKS_SAMCART_REGISTER_URL");
    expect(viewer).not.toContain("SHOW_BACK_TO_MAPSITE");

    expect(library).toContain("talisBooksShelfCta");
    expect(library).toContain("DemoClaimMarketButton");
    expect(library).toContain("TalisUMktsHeader");
    expect(library).not.toContain("Back to Mapsite");
    expect(library).not.toContain("bs.backToAllPins");
    expect(library).not.toContain("bs.register");
    expect(library).not.toContain("TALISBOOKS_SAMCART_REGISTER_URL");
    expect(library).not.toContain("talisBooksShelfShowBack");
    expect(library).not.toContain("SHOW_BACK_TO_MAPSITE");
  });
});
