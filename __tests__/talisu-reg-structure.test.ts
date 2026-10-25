import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  enforce: vi.fn(async () => undefined),
  locale: "en" as "en" | "de",
  cookie: undefined as string | undefined,
}));

vi.mock("@/lib/talisu/pmc-gate", () => ({
  enforcePmcRegistrationGate: env.enforce,
  firstParam: (v: unknown) => (Array.isArray(v) ? v[0] : v),
}));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => env.locale }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "talisu_reg_structure" && env.cookie ? { name, value: env.cookie } : undefined,
  }),
}));

import TalisURegisterPage from "../app/talisu/reg/page";
import SamCartEmbed from "../components/talisu/SamCartEmbed";
import AdviserLayout from "../components/talisu/AdviserLayout";
import RegisterStructureTabs from "../components/talisu/RegisterStructureTabs";
import { talisURegisterCheckoutHref } from "../lib/talisu/ask-step";
import {
  REGISTER_STRUCTURE_IDS,
  clearRegisterStructureCookie,
  normalizeRegisterStructure,
  registerStructureCheckoutUrl,
  registerStructureCookie,
  talisURegisterStructureHref,
} from "../lib/talisu/register-structure";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

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

async function renderReg(params: Record<string, string>) {
  return (await TalisURegisterPage({ searchParams: Promise.resolve(params) })) as ReactNode;
}

const hrefs = (html: string) =>
  [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

const BASE = "https://talispros.mysamcart.com/checkout/register";

describe("Aisha's register structure ids", () => {
  it("accepts the four structures (and old SPLITS links as Lease-to-Own)", () => {
    expect(REGISTER_STRUCTURE_IDS).toEqual([
      "conventional",
      "lease-to-own",
      "fractionalization",
      "tokenization",
    ]);
    for (const id of REGISTER_STRUCTURE_IDS) {
      expect(normalizeRegisterStructure(` ${id.toUpperCase()} `)).toBe(id);
    }
    expect(normalizeRegisterStructure("splits")).toBe("lease-to-own");
    expect(normalizeRegisterStructure(["tokenization", "conventional"])).toBe("tokenization");
    for (const bad of ["", "lease", "<script>", "https://evil.example", "conventional&step=x", null, undefined, 3]) {
      expect(normalizeRegisterStructure(bad)).toBeNull();
    }
  });

  it("builds the tab, checkout and SamCart links with ?structure=", () => {
    expect(talisURegisterStructureHref("lease-to-own")).toBe("/talisu/reg?structure=lease-to-own");
    expect(talisURegisterStructureHref("nope")).toBe("/talisu/reg");
    expect(talisURegisterCheckoutHref()).toBe("/talisu/reg?step=register");
    expect(talisURegisterCheckoutHref("Tokenization")).toBe("/talisu/reg?step=register&structure=tokenization");
    expect(talisURegisterCheckoutHref("evil")).toBe("/talisu/reg?step=register");
    expect(registerStructureCheckoutUrl(BASE, null)).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "evil")).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "fractionalization")).toBe(
      `${BASE}?structure=fractionalization&utm_term=fractionalization`,
    );
    expect(registerStructureCookie("conventional")).toMatch(/^talisu_reg_structure=conventional; path=\//);
    expect(clearRegisterStructureCookie()).toContain("max-age=0");
  });

  it("has the four tabs in EN and DE (Lease-to-Own = Mietkauf)", () => {
    expect(en.talisu.register.structures.map((s) => s.id)).toEqual([...REGISTER_STRUCTURE_IDS]);
    expect(de.talisu.register.structures.map((s) => s.id)).toEqual([...REGISTER_STRUCTURE_IDS]);
    expect(en.talisu.register.structures.map((s) => s.label)).toEqual([
      "Conventional",
      "Lease-to-Own",
      "Fractionalization",
      "Tokenization",
    ]);
    expect(de.talisu.register.structures.map((s) => s.label)).toEqual([
      "Konventionell",
      "Mietkauf",
      "Fraktionalisierung",
      "Tokenisierung",
    ]);
    const copy = JSON.stringify([en.talisu.register, de.talisu.register].map((r) => [r.adviserKicker, r.adviserTitle, r.structures]));
    expect(copy).not.toMatch(/TODO|TBD|placeholder|USD|Mapsite™|Ralf/i);
  });
});

describe("Aisha's /talisu/reg landing", () => {
  beforeEach(() => {
    env.enforce.mockClear();
    env.locale = "en";
    env.cookie = undefined;
  });

  it("uses the adviser layout with Aisha and the four structure tabs", async () => {
    const tree = await renderReg({});
    const layout = findAll(tree, (el) => el.type === AdviserLayout)[0];
    expect(layout.props.imageSrc).toBe("/images/mapsites/aisha-c.webp");
    expect(layout.props.title).toBe(en.talisu.register.adviserTitle);
    const tabs = findAll(tree, (el) => el.type === RegisterStructureTabs)[0];
    expect(tabs.props.initialId).toBeNull();
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("renders every tab as a link to /talisu/reg?structure=<id>", async () => {
    const html = renderToStaticMarkup((await renderReg({})) as ReactElement);
    for (const id of REGISTER_STRUCTURE_IDS) {
      expect(html).toMatch(new RegExp(`<a[^>]*href="/talisu/reg\\?structure=${id}"[^>]*data-testid="register-structures-${id}"`));
    }
    expect(hrefs(html)).toContain("/talisu/reg?step=register");
  });

  it("opens the tab from ?structure= and tags the Register button with it", async () => {
    for (const id of REGISTER_STRUCTURE_IDS) {
      const html = renderToStaticMarkup((await renderReg({ structure: id })) as ReactElement);
      expect(html).toContain(`data-testid="register-structures-panel" data-structure-id="${id}"`);
      expect(hrefs(html)).toContain(`/talisu/reg?step=register&structure=${id}`);
      expect(hrefs(html)).not.toContain("/talisu/reg?step=register");
    }
  });

  it("shows the German tab names", async () => {
    env.locale = "de";
    const html = renderToStaticMarkup((await renderReg({ structure: "lease-to-own" })) as ReactElement);
    expect(html).toContain("Mietkauf");
    expect(html).toContain("Wählen Sie Ihre Struktur");
  });
});

describe("Aisha's register checkout keeps the structure", () => {
  beforeEach(() => {
    env.enforce.mockClear();
    env.locale = "en";
    env.cookie = undefined;
  });

  it("keeps the PMC gate", async () => {
    await renderReg({ step: "register", structure: "tokenization" });
    expect(env.enforce).toHaveBeenCalledTimes(1);
  });

  it("passes ?structure= to SamCart and shows it on the checkout", async () => {
    const tree = await renderReg({ step: "register", structure: "lease-to-own" });
    const embed = findAll(tree, (el) => el.type === SamCartEmbed)[0];
    const url = new URL(String(embed.props.src));
    expect(`${url.origin}${url.pathname}`).toBe(BASE);
    expect(url.searchParams.get("structure")).toBe("lease-to-own");
    expect(url.searchParams.get("utm_term")).toBe("lease-to-own");
    const html = renderToStaticMarkup(tree as ReactElement);
    expect(html).toMatch(/data-testid="register-structure" data-structure-id="lease-to-own"/);
    expect(html).toContain("Selected structure:");
    expect(html).toContain("Lease-to-Own");
    expect(hrefs(html)).toContain("/talisu/reg?structure=lease-to-own");
  });

  it("falls back to the remembered structure after the PMC sequence", async () => {
    env.cookie = "fractionalization";
    const tree = await renderReg({ step: "register" });
    const src = String(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src);
    expect(new URL(src).searchParams.get("structure")).toBe("fractionalization");
  });

  it("prefers the URL over the cookie and ignores unknown values", async () => {
    env.cookie = "conventional";
    let tree = await renderReg({ step: "register", structure: "tokenization" });
    expect(String(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src)).toContain("structure=tokenization");
    env.cookie = "bogus";
    tree = await renderReg({ step: "register", structure: "https://evil.example" });
    expect(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src).toBe(BASE);
    expect(renderToStaticMarkup(tree as ReactElement)).not.toContain('data-testid="register-structure"');
  });

  it("shows the structure in German on the checkout", async () => {
    env.locale = "de";
    const html = renderToStaticMarkup((await renderReg({ step: "register", structure: "lease-to-own" })) as ReactElement);
    expect(html).toContain("Gewählte Struktur:");
    expect(html).toContain("Mietkauf");
  });

  it("keeps the client tabs writing the cookie and URL", () => {
    const tabs = readFileSync(resolve("components/talisu/RegisterStructureTabs.tsx"), "utf8");
    expect(tabs).toContain("rememberRegisterStructure(id)");
    expect(tabs).toContain("talisURegisterCheckoutHref(openId)");
    const lib = readFileSync(resolve("lib/talisu/register-structure.ts"), "utf8");
    expect(lib).toContain("registerStructureCookie(structure)");
    expect(lib).toContain("clearRegisterStructureCookie()");
    expect(lib).toContain("window.history.replaceState");
  });
});
