import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_OWNERSHIP_SECTIONS } from "../lib/talispros/ownership-models";

const root = process.cwd();

describe("Tokenization Learn More", () => {
  it("wires Tokenization popover CTA to /learn-more", () => {
    const tokenization = HOME_OWNERSHIP_SECTIONS.find(
      (s) => s.id === "tokenization",
    );
    expect(tokenization?.learnMoreHref).toBe("/learn-more");
    expect(tokenization?.learnMoreLabel).toBe("Learn More");

    const showcase = readFileSync(
      join(root, "components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain("learnMoreHref");
    expect(showcase).toContain("Learn More");
  });

  it("ships a 50/50 E-Book + Audio learn-more page", () => {
    const page = readFileSync(join(root, "app/learn-more/page.tsx"), "utf8");
    const layout = readFileSync(
      join(root, "app/learn-more/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("TalisUChrome");
    expect(page).toContain("md:grid-cols-2");
    expect(page).toContain("/talisu/eb");
    expect(page).toContain("/talisu/au");
    expect(page).toContain("E-Book");
    expect(page).toContain("Audio");
    expect(page).toContain("Talisbooks™");
    expect(page).toContain("Talispros™");
  });

  it("strips Talishouse storefront chrome (navbar/cart/Talisbot) like /talisu embed", () => {
    const shell = readFileSync(join(root, "components/RootShell.tsx"), "utf8");
    expect(shell).toContain('pathname === "/learn-more"');
    expect(shell).toContain('pathname.startsWith("/learn-more/")');
    const layout = readFileSync(
      join(root, "app/learn-more/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("TalisUChrome");
  });

});
