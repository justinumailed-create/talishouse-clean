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
    expect(tokenization?.learnMoreContact).toBeUndefined();

    const showcase = readFileSync(
      join(root, "components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain("learnMoreHref");
    expect(showcase).toContain("Learn More");
    expect(showcase).toContain("OwnershipLearnMoreForm");
  });

  it("opens a contact form Learn More for every non-Tokenization ownership button", () => {
    const others = HOME_OWNERSHIP_SECTIONS.filter((s) => s.id !== "tokenization");
    expect(others.length).toBeGreaterThan(0);
    for (const section of others) {
      expect(section.learnMoreContact).toBe(true);
      expect(section.learnMoreLabel).toBe("Learn More");
      expect(section.learnMoreHref).toBeUndefined();
    }

    const contact = readFileSync(
      join(root, "lib/talispros/ownership-contact.ts"),
      "utf8",
    );
    expect(contact).toContain("Just.inumailed@gmail.com");
    expect(contact).toContain("remecom@mac.com");
    expect(contact).not.toContain("kyptronix");

    const api = readFileSync(
      join(root, "app/api/ownership-contact/route.ts"),
      "utf8",
    );
    expect(api).toContain("OWNERSHIP_CONTACT_RECIPIENTS");
    expect(api).toContain("OWNERSHIP_CONTACT_SOURCE");
    expect(contact).toContain("ownership_learn_more");
    expect(api).toContain('from("leads")');
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

  it("shows bottom-left Talisbot on homepage embed only", () => {
    const shell = readFileSync(join(root, "components/RootShell.tsx"), "utf8");
    expect(shell).toContain('const showHomeTalisBot = pathname === "/"');
    expect(shell).toContain('<TalisBotChat position="left" />');
    // /learn-more remains embed without the home-only bot flag
    expect(shell).toMatch(/isEmbed[\s\S]*pathname === "\/learn-more"/);
    expect(shell).not.toMatch(/showHomeTalisBot = pathname === "\/learn-more"/);

    const bot = readFileSync(join(root, "components/TalisBotChat.tsx"), "utf8");
    expect(bot).toContain('position === "left" ? "bottom-6 left-6"');
    expect(bot).toContain('position = "right"');
  });

});
