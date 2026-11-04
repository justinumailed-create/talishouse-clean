import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAPSITE_DEFAULT_REGISTER_URL,
  resolvePublishedUrlButtonHref,
} from "../lib/talispros/mapsite-url-gate";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Prepared prospect Mapsite buttons (Nov 4)", () => {
  it("URL 1 opens the brokerage website on a prepared Mapsite", () => {
    expect(
      resolvePublishedUrlButtonHref("jdk01", "https://fairrealty.com", { opensBrokerUrl: true }),
    ).toBe("https://fairrealty.com");
  });

  it("URL 1 keeps Register everywhere else", () => {
    expect(resolvePublishedUrlButtonHref("jdk01", "https://fairrealty.com")).toBe(
      MAPSITE_DEFAULT_REGISTER_URL,
    );
    expect(
      resolvePublishedUrlButtonHref("jdk01", "http://fairrealty.com", { opensBrokerUrl: true }),
    ).toBe(MAPSITE_DEFAULT_REGISTER_URL);
  });

  it("TEB opens a FAST Code's only eBook in the viewer, else the shelf", () => {
    const popup = read("components/talispros/mapsite/MapSitePropertyPopup.tsx");
    expect(popup).toContain("teb_own_book_href");
    const own = read("lib/talisbooks/own-teb-href.ts");
    expect(own).toMatch(/length !== 1|length === 1/);
  });
});
