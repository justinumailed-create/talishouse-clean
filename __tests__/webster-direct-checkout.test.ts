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
import AdviserLayout from "../components/talisu/AdviserLayout";
import TopBoundFlipbook from "../components/product-flipbook/TopBoundFlipbook";
import { talisUEngageCheckoutHref } from "../lib/talisu/ask-step";
import {
  ENGAGE_STRUCTURE_IDS,
  engageStructureCheckoutUrl,
  normalizeEngageStructure,
} from "../lib/talisu/engage-structure";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

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

describe("Thorsten P down-payment checkout is open to everyone", () => {
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
    expect(ENGAGE_STRUCTURE_IDS).toEqual(["conventional", "splits", "fractionalization", "tokenization"]);
    for (const id of ENGAGE_STRUCTURE_IDS) {
      expect(normalizeEngageStructure(id)).toBe(id);
      expect(normalizeEngageStructure(` ${id.toUpperCase()} `)).toBe(id);
    }
    expect(normalizeEngageStructure(["splits", "tokenization"])).toBe("splits");
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
      "/talisu/engage?step=pay&product=P07&structure=splits",
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

  it("keeps only Share a Project Vision in the tab panels; Engage Thorsten P is the landing button", () => {
    const picker = read("components/talisu/TransactionStructurePicker.tsx");
    expect(picker).not.toContain("talisUEngageCheckoutHref");
    expect(picker).not.toContain("t.talisu.engageWebster");
    expect(picker).not.toContain("${testId}-engage");
    expect(picker).toContain("${testId}-learn-more");
    expect(en.talisu.engageWebster).toBe("Engage Thorsten P");
    expect(de.talisu.engageWebster).toBe("Thorsten P beauftragen");
    expect(en.talisu.engageStructure).toBe("Structure:");
    expect(de.talisu.engageStructure).toBe("Struktur:");
  });
});

describe("Thorsten P catalogue landing", () => {
  beforeEach(() => {
    gate.locale = "en";
  });

  const byTestId = (tree: ReactNode, id: string) =>
    findAll(tree, (el) => el.props["data-testid"] === id);
  const checkoutHrefs = (tree: ReactNode) =>
    findAll(tree, (el) => typeof el.props.href === "string")
      .map((el) => String(el.props.href))
      .filter((h) => h.startsWith("/talisu/engage?step=pay"));

  it("shows Thorsten P's portrait with the embedded catalogue flipbook instead of structure tabs", async () => {
    const tree = await renderEngage({});
    const layout = findAll(tree, (el) => el.type === AdviserLayout);
    expect(layout).toHaveLength(1);
    expect(layout[0].props.imageSrc).toBe("/talisu/webster-team-leader-v2.jpg");
    expect(layout[0].props.imageAlt).toBe("Thorsten P");
    expect(layout[0].props.kicker).toBe(en.talisu.engage.adviserKicker);
    expect(layout[0].props.title).toBe(en.talisu.engage.adviserTitle);
    const books = findAll(tree, (el) => el.type === TopBoundFlipbook);
    expect(books).toHaveLength(1);
    expect(books[0].props.variant).toBe("embedded");
    expect((books[0].props.pages as unknown[]).length).toBeGreaterThan(1);
    expect(byTestId(tree, "engage-structures")).toHaveLength(0);
    expect(read("app/talisu/engage/page.tsx")).not.toMatch(/EngageStructureSelection|TransactionStructurePicker/);
    expect(gate.enforce).not.toHaveBeenCalled();
  });

  it("has one checkout link: Engage Thorsten P → the down-payment checkout", async () => {
    const tree = await renderEngage({});
    expect(checkoutHrefs(tree)).toEqual(["/talisu/engage?step=pay"]);
    const cta = byTestId(tree, "partner-cta")[0];
    expect(textOf(cta)).toContain("Engage Thorsten P");
    expect(textOf(byTestId(tree, "talisu-engage-partner")[0])).toContain("Thorsten P — Team Leader");
  });

  it("keeps a catalogue ?product= code on the checkout link", async () => {
    const tree = await renderEngage({ product: "P07" });
    expect(checkoutHrefs(tree)).toEqual(["/talisu/engage?step=pay&product=P07"]);
    expect(byTestId(tree, "engage-ask-product")).toHaveLength(1);
  });

  it("still resolves old ?structure= links without errors and carries the value to checkout", async () => {
    for (const id of [...ENGAGE_STRUCTURE_IDS, "lease-to-own", "nonsense"]) {
      const tree = await renderEngage({ structure: id, product: "P07" });
      const hrefs = checkoutHrefs(tree);
      expect(hrefs).toHaveLength(1);
      expect(hrefs[0].startsWith("/talisu/engage?step=pay&product=P07")).toBe(true);
    }
    const tree = await renderEngage({ structure: "tokenization" });
    expect(checkoutHrefs(tree)).toEqual(["/talisu/engage?step=pay&structure=tokenization"]);
  });

  it("labels the landing in German", async () => {
    gate.locale = "de";
    const tree = await renderEngage({});
    expect(textOf(byTestId(tree, "partner-cta")[0])).toContain("Thorsten P beauftragen");
    const layout = findAll(tree, (el) => el.type === AdviserLayout)[0];
    expect(layout.props.kicker).toBe("Produktkatalog");
    expect(String(layout.props.title)).toContain("Thorsten P");
  });

  it("checkout Change goes back to the landing (no structure tabs anchor)", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const hrefs = (html: string) =>
      [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    const html = renderToStaticMarkup(
      (await renderEngage({ step: "pay", structure: "tokenization", product: "P07" })) as ReactElement,
    );
    expect(hrefs(html)).toContain("/talisu/engage?product=P07");
    expect(html).not.toContain("#structures");
    expect(html).toContain("Thorsten P");
    expect(html).not.toContain("Webster");
  });

  it("leaves the pill and big CTA props unused on Aisha's /talisu/reg landing", () => {
    expect(read("app/talisu/reg/page.tsx")).not.toMatch(/headlineCtaHref|mainCta/);
  });
});
