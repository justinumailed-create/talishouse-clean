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
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT;${url}`);
  },
}));
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
  normalizeRegisterLockReason,
  normalizeRegisterStructure,
  parseRegisterStructures,
  registerLockedHref,
  registerStructureCheckoutUrl,
  registerStructureCookie,
  talisURegisterStructureHref,
  toggleRegisterStructure,
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

  it("parses one or more structures (comma / repeated), drops unknown ones, de-duplicates", () => {
    expect(parseRegisterStructures("lease-to-own,tokenization")).toEqual(["lease-to-own", "tokenization"]);
    expect(parseRegisterStructures(["Tokenization", "splits,conventional", "evil", "tokenization"])).toEqual([
      "tokenization",
      "lease-to-own",
      "conventional",
    ]);
    expect(parseRegisterStructures("conventional%2Cfractionalization")).toEqual(["conventional", "fractionalization"]);
    expect(parseRegisterStructures(undefined)).toEqual([]);
    expect(parseRegisterStructures("<script>,https://evil.example")).toEqual([]);
  });

  it("toggles structures on and off, several at once", () => {
    let sel = toggleRegisterStructure([], "lease-to-own");
    expect(sel).toEqual(["lease-to-own"]);
    sel = toggleRegisterStructure(sel, "tokenization");
    expect(sel).toEqual(["lease-to-own", "tokenization"]);
    sel = toggleRegisterStructure(sel, "lease-to-own");
    expect(sel).toEqual(["tokenization"]);
    expect(toggleRegisterStructure(sel, "tokenization")).toEqual([]);
  });

  it("builds the tab, checkout, bounce and SamCart links with ?structure=a,b", () => {
    expect(talisURegisterStructureHref("lease-to-own")).toBe("/talisu/reg?structure=lease-to-own");
    expect(talisURegisterStructureHref(["lease-to-own", "tokenization"])).toBe(
      "/talisu/reg?structure=lease-to-own,tokenization",
    );
    expect(talisURegisterStructureHref("nope")).toBe("/talisu/reg");
    expect(talisURegisterCheckoutHref()).toBe("/talisu/reg?step=register");
    expect(talisURegisterCheckoutHref("Tokenization")).toBe("/talisu/reg?step=register&structure=tokenization");
    expect(talisURegisterCheckoutHref(["lease-to-own", "tokenization"])).toBe(
      "/talisu/reg?step=register&structure=lease-to-own,tokenization",
    );
    expect(talisURegisterCheckoutHref("evil")).toBe("/talisu/reg?step=register");
    expect(registerLockedHref()).toBe("/talisu/reg?locked=structure");
    expect(normalizeRegisterLockReason("Structure")).toBe("structure");
    expect(normalizeRegisterLockReason("design")).toBeNull();
    expect(registerStructureCheckoutUrl(BASE, null)).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "evil")).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "fractionalization")).toBe(
      `${BASE}?structure=fractionalization&utm_term=fractionalization`,
    );
    const multi = new URL(registerStructureCheckoutUrl(BASE, ["lease-to-own", "tokenization"]));
    expect(multi.searchParams.getAll("structure")).toEqual(["lease-to-own,tokenization"]);
    expect(multi.searchParams.getAll("utm_term")).toEqual(["lease-to-own,tokenization"]);
    expect(registerStructureCookie("conventional")).toMatch(/^talisu_reg_structure=conventional; path=\//);
    expect(registerStructureCookie(["conventional", "tokenization"])).toMatch(
      /^talisu_reg_structure=conventional%2Ctokenization; path=\//,
    );
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

  it("uses the adviser layout with Aisha and loads with no structure selected", async () => {
    const tree = await renderReg({});
    const layout = findAll(tree, (el) => el.type === AdviserLayout)[0];
    expect(layout.props.imageSrc).toBe("/images/mapsites/aisha-c.webp");
    expect(layout.props.title).toBe(en.talisu.register.adviserTitle);
    const tabs = findAll(tree, (el) => el.type === RegisterStructureTabs)[0];
    expect(tabs.props.initialIds).toEqual([]);
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("ignores an older remembered structure on load", async () => {
    env.cookie = "conventional";
    const tree = await renderReg({});
    expect(findAll(tree, (el) => el.type === RegisterStructureTabs)[0].props.initialIds).toEqual([]);
    const html = renderToStaticMarkup(tree as ReactElement);
    expect(html).toContain('data-selected-structure=""');
    expect(html).not.toContain('data-selected="true"');
  });

  it("locked with none: four unpressed toggles, a disabled Register button and the reason", async () => {
    const html = renderToStaticMarkup((await renderReg({})) as ReactElement);
    for (const id of REGISTER_STRUCTURE_IDS) {
      expect(html).toMatch(
        new RegExp(`<button type="button" data-testid="register-structures-${id}"[^>]*data-selected="false" aria-pressed="false"`),
      );
    }
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-testid="partner-cta" data-locked="structure"/);
    expect(html).toContain("Choose at least one structure");
    expect(html).toContain('data-testid="register-lock-reason-structure"');
    expect(html).not.toContain('data-testid="register-structures-panel"');
    expect(hrefs(html).some((h) => h.includes("step=register"))).toBe(false);
  });

  it("unlocked with one: ?structure= pre-selects it and the Register link carries it", async () => {
    for (const id of REGISTER_STRUCTURE_IDS) {
      const html = renderToStaticMarkup((await renderReg({ structure: id })) as ReactElement);
      expect(html).toMatch(new RegExp(`data-testid="register-structures-${id}"[^>]*data-selected="true" aria-pressed="true"`));
      expect(html).toContain(`data-testid="register-structures-${id}-check"`);
      expect(html).toContain(`data-testid="register-structures-panel" data-structure-id="${id}"`);
      expect(hrefs(html)).toContain(`/talisu/reg?step=register&structure=${id}`);
      expect(html).not.toContain('data-locked="structure"');
      expect(html).not.toContain("Choose at least one structure");
      expect(html).toContain("Selected structure:");
    }
  });

  it("multiple selected: both are pressed and both go to checkout", async () => {
    const html = renderToStaticMarkup(
      (await renderReg({ structure: "lease-to-own,tokenization" })) as ReactElement,
    );
    expect(html).toContain('data-selected-structure="lease-to-own,tokenization"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
    expect(hrefs(html)).toContain("/talisu/reg?step=register&structure=lease-to-own,tokenization");
    expect(html).toContain("Selected structures:");
    expect(html).toMatch(/Lease-to-Own, Tokenization/);
  });

  it("shows the bounce reason as an alert after a checkout URL without a structure", async () => {
    const html = renderToStaticMarkup((await renderReg({ locked: "structure" })) as ReactElement);
    expect(html).toMatch(/role="alert"[^>]*data-testid="register-lock-status"/);
    expect(html).toContain("Choose at least one structure");
  });

  it("shows the German tab names and reason", async () => {
    env.locale = "de";
    let html = renderToStaticMarkup((await renderReg({})) as ReactElement);
    expect(html).toContain("Wählen Sie mindestens eine Struktur");
    html = renderToStaticMarkup((await renderReg({ structure: "lease-to-own,tokenization" })) as ReactElement);
    expect(html).toContain("Mietkauf");
    expect(html).toContain("Gewählte Strukturen:");
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

  it("server redirect: a checkout URL with no valid structure goes back to the page with the reason", async () => {
    const bypasses: Record<string, string>[] = [
      { step: "register" },
      { step: "register", structure: "evil" },
      { step: "register", structure: "" },
    ];
    for (const params of bypasses) {
      await expect(renderReg(params)).rejects.toThrow("NEXT_REDIRECT;/talisu/reg?locked=structure");
    }
    await expect(renderReg({ step: "register", fastCode: "ABC123" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/reg?locked=structure&fastCode=ABC123",
    );
    // Redirected before the PMC gate runs.
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("tags SamCart with every selected structure", async () => {
    const tree = await renderReg({ step: "register", structure: "lease-to-own,tokenization" });
    const url = new URL(String(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src));
    expect(url.searchParams.get("structure")).toBe("lease-to-own,tokenization");
    expect(url.searchParams.get("utm_term")).toBe("lease-to-own,tokenization");
    const html = renderToStaticMarkup(tree as ReactElement);
    expect(html).toContain('data-testid="register-structure" data-structure-id="lease-to-own,tokenization"');
    expect(html).toContain("Selected structures:");
    expect(html).toContain("Lease-to-Own, Tokenization");
    expect(hrefs(html)).toContain("/talisu/reg?structure=lease-to-own,tokenization");
  });

  it("falls back to the remembered structure after the PMC sequence", async () => {
    env.cookie = "fractionalization";
    const tree = await renderReg({ step: "register" });
    const src = String(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src);
    expect(new URL(src).searchParams.get("structure")).toBe("fractionalization");
  });

  it("prefers the URL over the cookie and ignores unknown values", async () => {
    env.cookie = "conventional";
    const tree = await renderReg({ step: "register", structure: "tokenization" });
    expect(String(findAll(tree, (el) => el.type === SamCartEmbed)[0].props.src)).toContain("structure=tokenization");
    env.cookie = "bogus";
    await expect(renderReg({ step: "register", structure: "https://evil.example" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/reg?locked=structure",
    );
  });

  it("shows the structure in German on the checkout", async () => {
    env.locale = "de";
    const html = renderToStaticMarkup((await renderReg({ step: "register", structure: "lease-to-own" })) as ReactElement);
    expect(html).toContain("Gewählte Struktur:");
    expect(html).toContain("Mietkauf");
  });

  it("keeps the client tabs writing the cookie and URL", () => {
    const tabs = readFileSync(resolve("components/talisu/RegisterStructureTabs.tsx"), "utf8");
    expect(tabs).toContain("rememberRegisterStructure(next)");
    expect(tabs).toContain("talisURegisterCheckoutHref(selected)");
    expect(tabs).toContain("aria-pressed={isSelected}");
    const lib = readFileSync(resolve("lib/talisu/register-structure.ts"), "utf8");
    expect(lib).toContain("registerStructureCookie(structures)");
    expect(lib).toContain("clearRegisterStructureCookie()");
    expect(lib).toContain("window.history.replaceState");
  });
});
