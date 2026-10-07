import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { de } from "../lib/i18n/dictionaries/de";
import { TALISU_ENGAGE, TALISU_REGISTER } from "../lib/talisu/content";

describe("TalisU Register copy", () => {
  const bullets = TALISU_REGISTER.bullets;

  it("spells out TEB, TVA, and TTV instead of the short codes alone", () => {
    expect(bullets.map((b) => b.label)).toEqual([
      "Mapsites",
      "Talisbooks™ (TEB)",
      "Listing analysis (TVA)",
      "TalisTV™ (TTV)",
    ]);
  });

  it("says we provide and manage for TEB and TTV", () => {
    const teb = bullets.find((b) => b.label.includes("(TEB)"));
    const ttv = bullets.find((b) => b.label.includes("(TTV)"));
    const tva = bullets.find((b) => b.label.includes("(TVA)"));
    expect(teb?.text.startsWith("we provide and manage")).toBe(true);
    expect(ttv?.text).toContain("we provide and manage");
    expect(tva?.text.startsWith("we analyze")).toBe(true);
  });

  it("keeps account registration SamCart checkout", () => {
    expect(TALISU_REGISTER.samcartUrl).toBe(
      "https://talispros.mysamcart.com/checkout/register",
    );
    expect(TALISU_REGISTER).not.toHaveProperty("purchaseUrl");
    expect(TALISU_REGISTER).not.toHaveProperty("catalogue");
  });
});

describe("TalisU Register → Product (Webster) copy", () => {
  it("uses Customization Team in the engage headline", () => {
    expect(TALISU_ENGAGE.headline).toBe(
      "Send a Down Payment to engage Webster and his Customization Team",
    );
  });

  it("introduces Webster as the customization partner", () => {
    expect(TALISU_ENGAGE.partnerHeading).toBe("Your Customization Partner");
    expect(TALISU_ENGAGE.partnerName).toBe("Webster M. — Team Leader");
    expect(TALISU_ENGAGE.partnerImage).toBe("/talisu/webster-team-leader-v2.jpg");
    expect(TALISU_ENGAGE.paragraphs).toEqual([
      'Modular container or dome structures unlock "hyper-mobility" with structural reliability, allowing traffic-reliant businesses to deploy physical locations exactly where they find their customers.',
      "Built from standardized, durable “Corten” steel (corrosion resistant with high tensile strength) or fibreglass, prefabricated modules can be operationalized quickly.",
      "When installed on mobile platforms, they may negate the need for Building Permits in many North American jurisdictions.",
    ]);
  });

  it("lists the $2,000 down payment and 12-month protection", () => {
    expect(TALISU_ENGAGE.helpHeading).toBe("How we help:");
    expect(TALISU_ENGAGE.helpItems).toEqual([
      "Select a design and send a $2,000 Down Payment.",
      "It is applied in full to your order - and…",
      "Establishes your spot in the production and shipping queues.",
      "It also reserves time with our customization department to precisely realize your vision.",
    ]);
    expect(TALISU_ENGAGE.protectionHeading).toBe("Down Payment Protection:");
    expect(TALISU_ENGAGE.protectionText).toBe(
      "Your downpayment is protected for up to 12 months (or more by special arrangement on a case by case basis).",
    );
  });

  it("drops the product-line definitions and the $10,000 closing from the card", () => {
    expect(TALISU_ENGAGE).not.toHaveProperty("partnerIntro");
    expect(TALISU_ENGAGE).not.toHaveProperty("bullets");
    expect(TALISU_ENGAGE).not.toHaveProperty("closing");
    const card = [
      TALISU_ENGAGE.partnerHeading,
      TALISU_ENGAGE.partnerName,
      ...TALISU_ENGAGE.paragraphs,
      TALISU_ENGAGE.helpHeading,
      ...TALISU_ENGAGE.helpItems,
      TALISU_ENGAGE.protectionHeading,
      TALISU_ENGAGE.protectionText,
    ].join("\n");
    expect(card).not.toContain("Your Product Partner");
    expect(card).not.toContain("I am your Product Partner");
    expect(card).not.toContain("$10,000");
    expect(card).not.toMatch(/\bGH\b|\bTH\b|\bTT\b|\bTD\b/);
  });

  it("renders the new card on the engage page and leaves checkout chrome", () => {
    const page = readFileSync(resolve("app/talisu/engage/page.tsx"), "utf8");
    expect(page).toContain("TALISU_ENGAGE.paragraphs");
    expect(page).toContain("TALISU_ENGAGE.helpItems");
    expect(page).toContain("TALISU_ENGAGE.protectionHeading");
    expect(page).toContain("TALISU_ENGAGE.protectionText");
    expect(page).toContain("list-disc");
    expect(page).toContain("TALISU_ENGAGE.headline");
    expect(page).toContain("t.engageCustomizing");
    expect(page).toContain("SamCartEmbed");
    expect(page).not.toContain("partnerIntro");
    expect(page).not.toContain("TALISU_ENGAGE.closing");
    expect(page).not.toContain("b.label");
    expect(page).toContain("TALISU_ENGAGE.partnerImage");
  });

  it("translates the customization partner card into German (Sie)", () => {
    const engage = de.talisu.engage;
    expect(engage.partnerHeading).toBe("Ihr Anpassungspartner");
    expect(engage.partnerName).toBe("Webster M. – Teamleiter");
    expect(engage.partnerImage).toBe(TALISU_ENGAGE.partnerImage);
    expect(engage.paragraphs).toHaveLength(3);
    expect(engage.paragraphs[0]).toContain("„Hypermobilität“");
    expect(engage.paragraphs[1]).toContain("„Corten“-Stahl");
    expect(engage.helpHeading).toBe("So helfen wir Ihnen:");
    expect(engage.helpItems).toEqual([
      "Wählen Sie ein Design und leisten Sie eine Anzahlung von 2.000 $.",
      "Sie wird vollständig auf Ihre Bestellung angerechnet – und …",
      "Sie sichert Ihnen Ihren Platz in den Warteschlangen für Produktion und Versand.",
      "Außerdem reserviert sie Zeit bei unserer Anpassungsabteilung, um Ihre Vision präzise zu verwirklichen.",
    ]);
    expect(engage.protectionHeading).toBe("Schutz der Anzahlung:");
    expect(engage.protectionText).toBe(
      "Ihre Anzahlung ist bis zu 12 Monate geschützt (oder länger nach besonderer Vereinbarung von Fall zu Fall).",
    );
    expect(engage).not.toHaveProperty("partnerIntro");
    expect(engage).not.toHaveProperty("bullets");
    expect(engage).not.toHaveProperty("closing");
  });
});

describe("Register page without catalogue purchase section", () => {
  const page = readFileSync(resolve("app/talisu/reg/page.tsx"), "utf8");
  const welcome = readFileSync(resolve("app/talisu/page.tsx"), "utf8");
  const config = readFileSync(resolve("next.config.ts"), "utf8");

  it("keeps partner + register checkout and does not render Catalogue/Purchase or Sea-Cans", () => {
    expect(page).not.toContain('id="catalogue"');
    expect(page).not.toContain("purchaseUrl");
    expect(page).not.toContain("TalisU Purchase — SamCart");
    expect(page).not.toContain("loadProductFlipbookPages");
    expect(page).not.toContain("Open the catalogue");
    expect(page).toContain("SamCartEmbed");
    expect(page).toContain("TalisU Register — SamCart");
    expect(page).toContain("TALISU_REGISTER.samcartUrl");
    expect(page).not.toContain("opens in a new tab");
    expect(page).not.toMatch(/Sea-Can/i);
    expect(welcome).not.toMatch(/Sea-Can/i);
    expect(welcome).not.toContain('href="/talisu/bo"');
    expect(welcome).not.toContain('href="/talisu/au"');
    expect(welcome).toContain('id="faq"');
    expect(welcome).toContain("talisu.faq");
    expect(page).toContain("max-w-[1920px]");
    expect(page).toContain("minmax(16rem,20rem)_minmax(0,1fr)");
  });

  it("redirects Sea-Can routes to the Talishouse™ Product Catalogue", () => {
    for (const source of [
      '"/talisu/bo"',
      '"/talisu/bo/:path*"',
      '"/talisu/sh"',
      '"/talisu/cu"',
      '"/talisu/blog"',
    ]) {
      expect(config).toContain(`source: ${source}`);
    }
    expect(config).not.toContain('destination: "/talisu/reg"');
    expect(config).not.toContain('destination: "/talisu/reg#catalogue"');
    const seaCan = config.slice(
      config.indexOf("Sea-Can pages are not ready"),
      config.indexOf('source: "/talispros/start"'),
    );
    expect(seaCan.match(/destination: "\/catalogue"/g)).toHaveLength(8);
  });
});
