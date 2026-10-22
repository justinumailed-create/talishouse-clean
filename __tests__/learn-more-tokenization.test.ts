import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { HOME_OWNERSHIP_SECTIONS } from "../lib/talispros/ownership-models";

const root = process.cwd();

describe("Tokenization Learn More", () => {
  it("sends Tokenization Learn More to the Discuss a Project page like the other three", () => {
    const tokenization = HOME_OWNERSHIP_SECTIONS.find(
      (s) => s.id === "tokenization",
    );
    expect(tokenization?.learnMoreHref).toBe("/talisu/discuss?topic=tokenization");
    expect(tokenization?.learnMoreLabel).toBe("Learn More");

    const showcase = readFileSync(
      join(root, "components/talispros/TalisprosHomeShowcase.tsx"),
      "utf8",
    );
    expect(showcase).toContain("talisuHref(openSection.learnMoreHref)");
    expect(showcase).toContain("t.home.learnMore");
    expect(en.home.learnMore).toBe("Learn More");
    // Level 2 (transaction structures) never reverts to TalisBOT (Level 1).
    expect(showcase).not.toContain("openOwnershipContactInTalisBot");
    expect(showcase).not.toContain("learnMoreContact");
    expect(showcase).not.toContain("<OwnershipLearnMoreForm");

    const bot = readFileSync(join(root, "components/TalisBotChat.tsx"), "utf8");
    expect(bot).toContain("<OwnershipLearnMoreForm topic={contactTopic}");
  });

  it("Learn More form: topic picker only on the page, required NANP phone, Discuss a Project", () => {
    const form = readFileSync(
      join(root, "components/talispros/OwnershipLearnMoreForm.tsx"),
      "utf8",
    );
    // Bot keeps a hidden topic; only the /talisu/discuss page shows a picker + location.
    // Ralf (Oct 18): the page picks the structure with the CSFT buttons, not a <select>.
    expect(form).not.toContain("<select");
    expect(form).toContain('data-testid="discuss-topic"');
    expect(form).toContain('<input type="hidden" name="topic"');
    expect(form).toContain("MapSitePlaceSearch");
    expect(form).not.toContain("(optional)");
    expect(form).not.toContain("What would you like to know?");
    expect(form).toContain("c.project");
    expect(en.contactForm.project).toBe("Your Project");
    expect(en.contactForm.title).toBe("Share a Project Vision");
    expect(form).toMatch(/type="tel"[\s\S]*?required/);
    expect(form).toContain("isValidNanpPhone");
    expect(form).toContain("topic,");
    expect(form).not.toContain('className="fixed inset-0');

    const api = readFileSync(
      join(root, "app/api/ownership-contact/route.ts"),
      "utf8",
    );
    expect(api).toContain("formatNanpPhone");
  });

  it("points every ownership Learn More (EN + DE) at the Discuss a Project page", () => {
    expect(HOME_OWNERSHIP_SECTIONS.length).toBe(4);
    for (const section of HOME_OWNERSHIP_SECTIONS) {
      expect(section.learnMoreLabel).toBe("Learn More");
      expect(section.learnMoreHref).toBe(`/talisu/discuss?topic=${section.id}`);
    }
    for (const section of de.home.ownershipSections) {
      expect(section.learnMoreHref).toBe(`/talisu/discuss?topic=${section.id}`);
    }
    const page = readFileSync(join(root, "app/talisu/discuss/page.tsx"), "utf8");
    expect(page).toContain('pageMetadata("/talisu/discuss")');
    expect(page).toContain("ownershipTopicFromId");

    const contact = readFileSync(
      join(root, "lib/talispros/ownership-contact.ts"),
      "utf8",
    );
    expect(contact).toContain("Just.inumailed@gmail.com");
    expect(contact).toContain("remecom@mac.com");
    expect(contact).toContain("Tokenization");
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
    expect(page).toContain('pageMetadata("/learn-more")');
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
    // Homepage launcher sits in the left-column slot; the open panel stays fixed above it.
    expect(bot).toContain("HOME_TALISBOT_SLOT_ID");
    expect(bot).toContain("createPortal(launcher, homeSlot)");
    expect(bot).toContain("z-[1000]");
  });

});
