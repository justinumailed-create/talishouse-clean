import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({
  enforce: vi.fn(async () => {
    throw new Error("NEXT_REDIRECT;/talispros/demo");
  }),
  locale: "en" as "en" | "de",
}));

vi.mock("@/lib/talisu/pmc-gate", () => ({
  enforcePmcRegistrationGate: gate.enforce,
  firstParam: (v: unknown) => (Array.isArray(v) ? v[0] : v),
}));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => gate.locale }));

import TalisUEngagePage from "../app/talisu/engage/page";
import SamCartEmbed from "../components/talisu/SamCartEmbed";
import { talisUEngageCheckoutHref } from "../lib/talisu/ask-step";
import {
  ENGAGE_STRUCTURE_IDS,
  engageStructureCheckoutUrl,
  normalizeEngageStructure,
} from "../lib/talisu/engage-structure";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";
import { canonicalOwnershipTopic, ownershipTopicFromId } from "../lib/talispros/ownership-contact";

const read = (file: string) => readFileSync(resolve(file), "utf8");

type AnyElement = ReactElement<Record<string, unknown> & { children?: ReactNode }>;

function findAll(node: ReactNode, match: (el: AnyElement) => boolean, out: AnyElement[] = []): AnyElement[] {
  if (Array.isArray(node)) {
    for (const child of node) findAll(child as ReactNode, match, out);
    return out;
  }
  if (!isValidElement(node)) return out;
  const el = node as AnyElement;
  if (match(el)) out.push(el);
  for (const value of Object.values(el.props ?? {})) {
    if (isValidElement(value) || Array.isArray(value)) findAll(value as ReactNode, match, out);
  }
  return out;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((n) => textOf(n as ReactNode)).join("");
  if (isValidElement(node)) return textOf((node as AnyElement).props.children);
  return "";
}

async function renderEngage(params: Record<string, string>) {
  return (await TalisUEngagePage({ searchParams: Promise.resolve(params) })) as ReactNode;
}

describe("Webster down-payment checkout is open to everyone", () => {
  beforeEach(() => {
    gate.enforce.mockClear();
    gate.locale = "en";
  });

  it("renders the SamCart checkout for a signed-out visitor without the PMC gate", async () => {
    const tree = await renderEngage({ step: "pay" });
    expect(gate.enforce).not.toHaveBeenCalled();
    const embeds = findAll(tree, (el) => el.type === SamCartEmbed);
    expect(embeds).toHaveLength(1);
    expect(embeds[0].props.src).toBe("https://talispros.mysamcart.com/checkout/custom");
  });

  it("keeps catalogue units and the chosen structure on the checkout", async () => {
    const tree = await renderEngage({ step: "pay", product: "P07", structure: "Tokenization" });
    expect(gate.enforce).not.toHaveBeenCalled();
    const src = String(findAll(tree, (el) => el.type === SamCartEmbed)[0]?.props.src);
    const url = new URL(src);
    expect(url.searchParams.get("product")).toBe("P07");
    expect(url.searchParams.get("structure")).toBe("tokenization");
    expect(url.searchParams.get("utm_term")).toBe("tokenization");
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure");
    expect(shown).toHaveLength(1);
    expect(shown[0].props["data-structure-id"]).toBe("tokenization");
  });

  it("shows the localized structure name in German", async () => {
    gate.locale = "de";
    const tree = await renderEngage({ step: "pay", structure: "fractionalization" });
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure")[0];
    const text = textOf(shown);
    expect(text).toContain("Struktur:");
    expect(text).toContain("Fraktionalisierung");
  });

  it("maps a legacy splits link to Lease-to-Own and sends lease-to-own to SamCart", async () => {
    const tree = await renderEngage({ step: "pay", structure: "splits" });
    const src = String(findAll(tree, (el) => el.type === SamCartEmbed)[0]?.props.src);
    const url = new URL(src);
    expect(url.searchParams.get("structure")).toBe("lease-to-own");
    expect(url.searchParams.get("utm_term")).toBe("lease-to-own");
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure")[0];
    expect(shown.props["data-structure-id"]).toBe("lease-to-own");
    expect(textOf(shown)).toContain("Lease-to-Own");
    gate.locale = "de";
    const german = findAll(
      await renderEngage({ step: "pay", structure: "splits" }),
      (el) => el.props["data-testid"] === "engage-structure",
    )[0];
    expect(textOf(german)).toContain("Mietkauf");
    expect(textOf(german)).not.toContain("SPLITS");
  });

  it("ignores unknown structure values", async () => {
    const tree = await renderEngage({ step: "pay", structure: "https://evil.example" });
    const src = String(findAll(tree, (el) => el.type === SamCartEmbed)[0]?.props.src);
    expect(src).not.toContain("structure=");
    expect(findAll(tree, (el) => el.props["data-testid"] === "engage-structure")).toHaveLength(0);
  });

  it("no longer imports or calls the PMC gate on the engage page", () => {
    const page = read("app/talisu/engage/page.tsx");
    expect(page).not.toContain("enforcePmcRegistrationGate");
    expect(page).not.toContain("pmc-gate");
    expect(page).not.toMatch(/\bredirect\(/);
  });

  it("keeps the PMC gate on every other registration page", () => {
    for (const file of [
      "app/talisu/reg/page.tsx",
      "app/register/page.tsx",
      "app/subscription/page.tsx",
      "app/talispros/register/page.tsx",
      "app/register-mapsite/page.tsx",
    ]) {
      expect(read(file), file).toMatch(/await enforcePmcRegistrationGate\(/);
    }
  });
});

describe("transaction structure param", () => {
  it("accepts only the four structures, case-insensitively", () => {
    expect(ENGAGE_STRUCTURE_IDS).toEqual(["conventional", "lease-to-own", "fractionalization", "tokenization"]);
    for (const id of ENGAGE_STRUCTURE_IDS) {
      expect(normalizeEngageStructure(id)).toBe(id);
      expect(normalizeEngageStructure(` ${id.toUpperCase()} `)).toBe(id);
    }
    expect(normalizeEngageStructure(["splits", "tokenization"])).toBe("lease-to-own");
    expect(normalizeEngageStructure("SPLITS")).toBe("lease-to-own");
    expect(ownershipTopicFromId("splits")).toBe("Lease-to-Own");
    expect(ownershipTopicFromId("lease-to-own")).toBe("Lease-to-Own");
    expect(canonicalOwnershipTopic("SPLITS")).toBe("Lease-to-Own");
    expect(en.contactForm.topics["Lease-to-Own"]).toBe("Lease-to-Own");
    expect(de.contactForm.topics["Lease-to-Own"]).toBe("Mietkauf");
    expect(en.home.ownershipSections.map((s) => s.title)).toContain("Lease-to-Own");
    expect(de.home.ownershipSections.map((s) => s.title)).toContain("Mietkauf");
    for (const bad of ["", "token", "tokenization2", "<script>", "../x", "conventional&step=x", null, undefined]) {
      expect(normalizeEngageStructure(bad)).toBeNull();
    }
  });

  it("round-trips through the checkout link and the SamCart URL", () => {
    expect(talisUEngageCheckoutHref(null)).toBe("/talisu/engage?step=pay");
    expect(talisUEngageCheckoutHref(null, "tokenization")).toBe(
      "/talisu/engage?step=pay&structure=tokenization",
    );
    expect(talisUEngageCheckoutHref("P07", "SPLITS")).toBe(
      "/talisu/engage?step=pay&product=P07&structure=lease-to-own",
    );
    expect(talisUEngageCheckoutHref("P07", "lease-to-own")).toBe(
      "/talisu/engage?step=pay&product=P07&structure=lease-to-own",
    );
    expect(talisUEngageCheckoutHref(null, "nope")).toBe("/talisu/engage?step=pay");
    const href = talisUEngageCheckoutHref(null, "fractionalization");
    const back = new URL(href, "https://www.talispros.com").searchParams.get("structure");
    expect(normalizeEngageStructure(back)).toBe("fractionalization");

    const base = "https://talispros.mysamcart.com/checkout/custom";
    expect(engageStructureCheckoutUrl(base, null)).toBe(base);
    expect(engageStructureCheckoutUrl(base, "evil")).toBe(base);
    expect(engageStructureCheckoutUrl(`${base}?product=P07&utm_content=P07`, "conventional")).toBe(
      `${base}?product=P07&utm_content=P07&structure=conventional&utm_term=conventional`,
    );
  });

  it("keeps only Share a Project Vision in the tab panels; Engage Webster sits beside Webster's card", () => {
    const picker = read("components/talisu/TransactionStructurePicker.tsx");
    expect(picker).not.toContain("talisUEngageCheckoutHref");
    expect(picker).not.toContain("t.talisu.engageWebster");
    expect(picker).not.toContain("${testId}-engage");
    expect(picker).toContain("${testId}-learn-more");
    expect(en.talisu.engageWebster).toBe("Engage Webster");
    expect(de.talisu.engageWebster).toBe("Webster beauftragen");
    expect(en.talisu.engageStructure).toBe("Structure:");
    expect(de.talisu.engageStructure).toBe("Struktur:");
  });
});

describe("Webster landing structure note", () => {
  it("follows the intro line in EN and DE, on the landing only", async () => {
    expect(en.talisu.engage.landingStructureNote).toBe(
      "The structure you settle on with Webster shapes how your Mapsite and eBook present your project.",
    );
    expect(de.talisu.engage.landingStructureNote).toBe(
      "Die Struktur, die Sie mit Webster festlegen, bestimmt, wie Ihre Mapsite und Ihr eBook Ihr Projekt präsentieren.",
    );
    const page = read("app/talisu/engage/page.tsx");
    expect(page.match(/landingStructureNote/g)).toHaveLength(1);
    expect(page.indexOf("landingStructureNote")).toBeGreaterThan(page.indexOf("TALISU_ENGAGE.landingIntro"));
    gate.locale = "en";
    const landing = findAll(await renderEngage({}), (el) => el.props["data-testid"] === "engage-structure-note");
    expect(landing.map((el) => textOf(el))).toEqual([en.talisu.engage.landingStructureNote]);
    const checkout = await renderEngage({ step: "pay" });
    expect(findAll(checkout, (el) => el.props["data-testid"] === "engage-structure-note")).toHaveLength(0);
  });
});

describe("Webster landing links", () => {
  beforeEach(() => {
    gate.locale = "en";
  });

  async function landingHtml(params: Record<string, string> = {}) {
    const { renderToStaticMarkup } = await import("react-dom/server");
    return renderToStaticMarkup((await renderEngage(params)) as ReactElement);
  }

  const hrefs = (html: string) =>
    [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const checkoutHrefs = (html: string) => hrefs(html).filter((h) => h.startsWith("/talisu/engage?step=pay"));
  const tag = (html: string, testId: string) =>
    html.match(new RegExp(`<a[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? "";

  it("headline pill scrolls to the structure tabs instead of the checkout", async () => {
    const html = await landingHtml();
    expect(tag(html, "partner-headline-cta")).toContain('href="#structures"');
    expect(html).toContain('id="structures"');
    expect(html).toMatch(/<div[^>]*id="structures"[^>]*tabindex="-1"/);
    expect(html).toContain(en.talisu.engage.ctaLabel);
  });

  it("has exactly one checkout link: Engage Webster beside the card, with the default structure", async () => {
    const html = await landingHtml();
    expect(checkoutHrefs(html)).toEqual(["/talisu/engage?step=pay&structure=conventional"]);
    const cta = tag(html, "partner-cta");
    expect(cta).toContain('data-structure-id="conventional"');
    expect(html).toMatch(/data-testid="partner-cta"[^>]*>Engage Webster<span[^>]*>→<\/span><\/a>/);
    expect(html).not.toContain("engage-structures-engage");
    expect(html).toContain("engage-structures-learn-more");
    expect(html).toContain(en.talisu.engage.headline);
    expect(html).toContain(en.talisu.engage.ctaNote);
    expect(html).not.toMatch(/<a[^>]*>[^<]*Send a Down Payment/);
  });

  it("uses the preselected structure and keeps ?product=", async () => {
    for (const id of ENGAGE_STRUCTURE_IDS) {
      const html = await landingHtml({ structure: id, product: "P07" });
      expect(checkoutHrefs(html)).toEqual([`/talisu/engage?step=pay&product=P07&structure=${id}`]);
    }
    const legacy = await landingHtml({ structure: "splits", product: "P07" });
    expect(checkoutHrefs(legacy)).toEqual([
      "/talisu/engage?step=pay&product=P07&structure=lease-to-own",
    ]);
    expect(legacy).toContain('data-structure-id="lease-to-own"');
    expect(legacy).toContain("Lease-to-Own");
  });

  it("labels the button in German", async () => {
    gate.locale = "de";
    const html = await landingHtml();
    expect(html).toMatch(/data-testid="partner-cta"[^>]*>Webster beauftragen<span/);
    expect(tag(html, "partner-headline-cta")).toContain('href="#structures"');
  });

  it("checkout Change goes back to the structure tabs", async () => {
    const html = await landingHtml({ step: "pay", structure: "tokenization", product: "P07" });
    expect(hrefs(html)).toContain("/talisu/engage?product=P07#structures");
    const plain = await landingHtml({ step: "pay", structure: "splits" });
    expect(hrefs(plain)).toContain("/talisu/engage#structures");
  });

  it("leaves the pill and big CTA unchanged on Aisha's /talisu/reg landing", () => {
    expect(read("app/talisu/reg/page.tsx")).not.toMatch(/headlineCtaHref|mainCta/);
    const landing = read("components/talisu/PartnerLanding.tsx");
    expect(landing).toContain("href={headlineCtaHref ?? ctaHref}");
    expect(landing).toContain("{mainCta ?? (");
  });
});
