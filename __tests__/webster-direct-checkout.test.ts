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
const req = vi.hoisted(() => ({ cookies: {} as Record<string, string> }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name in req.cookies ? { name, value: req.cookies[name] } : undefined),
  }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT;${url}`);
  },
}));

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TalisUEngagePage from "../app/talisu/engage/page";
import SamCartEmbed from "../components/talisu/SamCartEmbed";
import AdviserLayout from "../components/talisu/AdviserLayout";
import EngageSelection from "../components/talisu/EngageSelection";
import { LocaleProvider } from "../lib/i18n/client";
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


describe("Thorsten P down-payment checkout is open to everyone", () => {
  beforeEach(() => {
    gate.enforce.mockClear();
    gate.locale = "en";
    req.cookies = {};
  });

  const embedSrc = (tree: ReactNode) => String(findAll(tree, (el) => el.type === SamCartEmbed)[0]?.props.src);

  it("renders the SamCart checkout for a signed-out visitor without the PMC gate", async () => {
    const tree = await renderEngage({ step: "pay", structure: "conventional", product: "P07" });
    expect(gate.enforce).not.toHaveBeenCalled();
    const embeds = findAll(tree, (el) => el.type === SamCartEmbed);
    expect(embeds).toHaveLength(1);
    expect(embeds[0].props.src).toBe(
      "https://talispros.mysamcart.com/checkout/custom?product=P07&utm_content=P07&structure=conventional&utm_term=conventional",
    );
  });

  it("keeps catalogue units and the chosen structure on the checkout", async () => {
    const tree = await renderEngage({ step: "pay", product: "P07", structure: "Tokenization" });
    expect(gate.enforce).not.toHaveBeenCalled();
    const url = new URL(embedSrc(tree));
    expect(url.searchParams.get("product")).toBe("P07");
    expect(url.searchParams.get("structure")).toBe("tokenization");
    expect(url.searchParams.get("utm_term")).toBe("tokenization");
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure");
    expect(shown).toHaveLength(1);
    expect(shown[0].props["data-structure-id"]).toBe("tokenization");
  });

  it("carries several selected designs to SamCart as one comma-joined product / utm_content value", async () => {
    const tree = await renderEngage({ step: "pay", product: "P03,P07", structure: "lease-to-own" });
    const url = new URL(embedSrc(tree));
    expect(url.searchParams.get("product")).toBe("P03,P07");
    expect(url.searchParams.get("utm_content")).toBe("P03,P07");
    expect(url.searchParams.getAll("product")).toHaveLength(1);
    expect(url.searchParams.get("structure")).toBe("lease-to-own");
    const box = findAll(tree, (el) => el.props["data-testid"] === "engage-product")[0];
    expect(box.props["data-product-codes"]).toBe("P03,P07");
  });

  it("reads the structure from Aisha's cookie when the URL has none", async () => {
    req.cookies = { talisu_reg_structure: "fractionalization" };
    const tree = await renderEngage({ step: "pay", product: "P07" });
    expect(new URL(embedSrc(tree)).searchParams.get("structure")).toBe("fractionalization");
  });

  it("shows the localized structure name in German", async () => {
    gate.locale = "de";
    const tree = await renderEngage({ step: "pay", structure: "fractionalization", product: "P07" });
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure")[0];
    const text = textOf(shown);
    expect(text).toContain("Struktur:");
    expect(text).toContain("Fraktionalisierung");
  });

  it("maps a legacy splits link to Lease-to-Own and sends lease-to-own to SamCart", async () => {
    const tree = await renderEngage({ step: "pay", structure: "splits", product: "P07" });
    const url = new URL(embedSrc(tree));
    expect(url.searchParams.get("structure")).toBe("lease-to-own");
    expect(url.searchParams.get("utm_term")).toBe("lease-to-own");
    const shown = findAll(tree, (el) => el.props["data-testid"] === "engage-structure")[0];
    expect(shown.props["data-structure-id"]).toBe("lease-to-own");
    expect(textOf(shown)).toContain("Lease-to-Own");
    gate.locale = "de";
    const german = findAll(
      await renderEngage({ step: "pay", structure: "splits", product: "P07" }),
      (el) => el.props["data-testid"] === "engage-structure",
    )[0];
    expect(textOf(german)).toContain("Mietkauf");
    expect(textOf(german)).not.toContain("SPLITS");
  });

  it("server-redirects a direct step=pay URL without a valid structure back to the locked landing", async () => {
    await expect(renderEngage({ step: "pay", structure: "https://evil.example", product: "P07" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/engage?locked=structure&product=P07",
    );
    await expect(renderEngage({ step: "pay", product: "P07" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/engage?locked=structure&product=P07",
    );
    req.cookies = { talisu_reg_structure: "nonsense" };
    await expect(renderEngage({ step: "pay" })).rejects.toThrow("NEXT_REDIRECT;/talisu/engage?locked=structure");
  });

  it("server-redirects a direct step=pay URL without a valid design back to the locked landing", async () => {
    await expect(renderEngage({ step: "pay", structure: "tokenization" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/engage?locked=design&structure=tokenization",
    );
    await expect(renderEngage({ step: "pay", structure: "tokenization", product: "P999,<x>" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/engage?locked=design&structure=tokenization",
    );
  });

  it("no longer imports or calls the PMC gate; its only redirect is the Engage lock", () => {
    const page = read("app/talisu/engage/page.tsx");
    expect(page).not.toContain("enforcePmcRegistrationGate");
    expect(page).not.toContain("pmc-gate");
    expect(page.match(/\bredirect\(/g)).toHaveLength(1);
    expect(page).toContain("redirect(engageLockedHref(");
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
    req.cookies = {};
  });

  const byTestId = (tree: ReactNode, id: string) =>
    findAll(tree, (el) => el.props["data-testid"] === id);
  const html = (tree: ReactNode, locale: "en" | "de" = "en") =>
    renderToStaticMarkup(createElement(LocaleProvider, { locale, children: tree }));
  const hrefsOf = (markup: string) =>
    [...markup.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const checkoutHrefs = (markup: string) => hrefsOf(markup).filter((h) => h.includes("step=pay"));
  const cta = (markup: string) => markup.match(/<(a|button)[^>]*data-testid="partner-cta"[^>]*>[\s\S]*?<\/\1>/)?.[0] ?? "";

  it("shows Thorsten P's portrait with the catalogue design gallery (no flipbook, no structure tabs)", async () => {
    const tree = await renderEngage({});
    const layout = findAll(tree, (el) => el.type === AdviserLayout);
    expect(layout).toHaveLength(1);
    expect(layout[0].props.imageSrc).toBe("/talisu/webster-team-leader-v2.jpg");
    expect(layout[0].props.imageAlt).toBe("Thorsten P");
    expect(layout[0].props.kicker).toBe(en.talisu.engage.adviserKicker);
    expect(layout[0].props.title).toBe(en.talisu.engage.adviserTitle);
    const selection = findAll(tree, (el) => el.type === EngageSelection);
    expect(selection).toHaveLength(1);
    expect((selection[0].props.designs as unknown[]).length).toBe(108);
    const markup = html(tree);
    expect(markup.match(/data-testid="engage-design"/g)).toHaveLength(108);
    expect(read("app/talisu/engage/page.tsx")).not.toContain("TopBoundFlipbook");
    expect(byTestId(tree, "engage-structures")).toHaveLength(0);
    expect(read("app/talisu/engage/page.tsx")).not.toMatch(/EngageStructureSelection|TransactionStructurePicker/);
    expect(gate.enforce).not.toHaveBeenCalled();
  });

  it("is locked with no structure: disabled CTA, link to Aisha's page, no checkout link", async () => {
    const markup = html(await renderEngage({ product: "P07" }));
    expect(checkoutHrefs(markup)).toEqual([]);
    expect(cta(markup)).toMatch(/^<button[^>]*disabled/);
    expect(cta(markup)).toContain('data-locked="structure"');
    expect(cta(markup)).toContain("Engage Thorsten P");
    expect(markup).toContain('data-testid="engage-lock-reason-structure"');
    expect(markup).toContain("Choose a structure on Aisha&#x27;s page first");
    expect(hrefsOf(markup)).toContain("/talisu/reg");
    // The catalogue ?product= code is preselected.
    expect(markup).toContain("Selected: P07");
    expect(markup).toMatch(/data-product-code="P07"[^>]*data-selected="true"|data-selected="true"[^>]*data-product-code="P07"/);
    expect(markup).toContain("Thorsten P — Team Leader");
  });

  it("is locked with no design even when the structure is chosen", async () => {
    for (const tree of [
      await renderEngage({ structure: "tokenization" }),
      (req.cookies = { talisu_reg_structure: "conventional" }, await renderEngage({})),
    ]) {
      const markup = html(tree);
      expect(checkoutHrefs(markup)).toEqual([]);
      expect(cta(markup)).toMatch(/^<button[^>]*disabled/);
      expect(cta(markup)).toContain('data-locked="design"');
      expect(markup).toContain("Select at least one design");
      expect(markup).toContain('data-testid="engage-selected-structure"');
    }
  });

  it("unlocks with a structure and a design: the single CTA carries both to step=pay", async () => {
    const markup = html(await renderEngage({ structure: "tokenization", product: "P03,P07" }));
    expect(checkoutHrefs(markup)).toEqual(["/talisu/engage?step=pay&structure=tokenization&product=P03,P07"]);
    expect(cta(markup)).toMatch(/^<a[^>]*href="\/talisu\/engage\?step=pay/);
    expect(markup).toContain("Selected: P03, P07");
    expect(markup).toContain("Structure: Tokenization");
    // Aisha's cookie works too, and a legacy splits link maps to lease-to-own.
    req.cookies = { talisu_reg_structure: "lease-to-own" };
    expect(checkoutHrefs(html(await renderEngage({ product: "P07" })))).toEqual([
      "/talisu/engage?step=pay&structure=lease-to-own&product=P07",
    ]);
    req.cookies = {};
    expect(checkoutHrefs(html(await renderEngage({ structure: "splits", product: "P07" })))).toEqual([
      "/talisu/engage?step=pay&structure=lease-to-own&product=P07",
    ]);
    // Unknown structure values never unlock.
    expect(checkoutHrefs(html(await renderEngage({ structure: "nonsense", product: "P07" })))).toEqual([]);
  });

  it("explains a server bounce from step=pay", async () => {
    const markup = html(await renderEngage({ locked: "structure", product: "P07" }));
    expect(markup).toMatch(/data-testid="engage-lock-status"[^>]*role="alert"|role="alert"[^>]*data-testid="engage-lock-status"/);
  });

  it("labels the landing in German", async () => {
    gate.locale = "de";
    const tree = await renderEngage({});
    const markup = html(tree, "de");
    expect(cta(markup)).toContain("Thorsten P beauftragen");
    expect(markup).toContain("Wählen Sie zuerst auf Aishas Seite eine Struktur");
    expect(markup).toContain("Auswählen");
    const layout = findAll(tree, (el) => el.type === AdviserLayout)[0];
    expect(layout.props.kicker).toBe("Produktkatalog");
    expect(String(layout.props.title)).toContain("Thorsten P");
    const unlocked = html(await renderEngage({ structure: "fractionalization", product: "P07" }), "de");
    expect(unlocked).toContain("Ausgewählt: P07");
    expect(unlocked).toContain("Struktur: Fraktionalisierung");
  });

  it("checkout Change goes back to the landing (no structure tabs anchor)", async () => {
    const markup = renderToStaticMarkup(
      (await renderEngage({ step: "pay", structure: "tokenization", product: "P07" })) as ReactElement,
    );
    expect(hrefsOf(markup)).toContain("/talisu/engage?structure=tokenization&product=P07");
    expect(hrefsOf(markup).some((h) => h.startsWith("/talisu/reg"))).toBe(true);
    expect(markup).not.toContain("#structures");
    expect(markup).toContain("Thorsten P");
    expect(markup).not.toContain("Webster");
  });

  it("leaves the pill and big CTA props unused on Aisha's /talisu/reg landing", () => {
    expect(read("app/talisu/reg/page.tsx")).not.toMatch(/headlineCtaHref|mainCta/);
  });
});
