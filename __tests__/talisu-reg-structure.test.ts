import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  enforce: vi.fn(async () => undefined),
  locale: "en" as "en" | "de",
  cookie: undefined as string | undefined,
  entry: true,
}));

vi.mock("@/lib/talisu/register-entry", () => ({ hasRegisterEntry: async () => env.entry }));
vi.mock("@/app/talisu/reg/actions", () => ({ redeemRegisterEntryAction: vi.fn() }));

vi.mock("@/lib/talisu/pmc-gate", () => ({
  enforcePmcRegistrationGate: env.enforce,
  firstParam: (v: unknown) => (Array.isArray(v) ? v[0] : v),
}));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => env.locale }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
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
import RegisterActions from "../components/talisu/RegisterActions";
import { talisURegisterCheckoutHref } from "../lib/talisu/ask-step";
import {
  REGISTER_STRUCTURE_IDS,
  clearRegisterStructureCookie,
  normalizeRegisterLockReason,
  normalizeRegisterStructure,
  parseSingleRegisterStructure,
  registerLockedHref,
  registerStructureCheckoutUrl,
  registerStructureCookie,
  selectRegisterStructure,
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

  it("parses exactly one structure; comma lists, repeats and unknown values are rejected", () => {
    expect(parseSingleRegisterStructure("Tokenization")).toBe("tokenization");
    expect(parseSingleRegisterStructure("splits")).toBe("lease-to-own");
    expect(parseSingleRegisterStructure(["conventional"])).toBe("conventional");
    for (const bad of [
      "lease-to-own,tokenization",
      "conventional%2Cfractionalization",
      "tokenization,",
      ["tokenization", "conventional"],
      ["tokenization", "tokenization"],
      "evil",
      "",
      "%E0%A4%A",
      undefined,
      null,
    ]) {
      expect(parseSingleRegisterStructure(bad)).toBeNull();
    }
  });

  it("is single-select: switching tabs replaces the selection, re-clicking keeps it", () => {
    let sel = selectRegisterStructure(null, "lease-to-own");
    expect(sel).toBe("lease-to-own");
    sel = selectRegisterStructure(sel, "tokenization");
    expect(sel).toBe("tokenization");
    // Clicking the selected tab again keeps it (radio behaviour, no clearing).
    expect(selectRegisterStructure(sel, "tokenization")).toBe("tokenization");
    expect(selectRegisterStructure(sel, "evil")).toBe("tokenization");
  });

  it("builds the tab, checkout, bounce and SamCart links with exactly one ?structure=", () => {
    expect(talisURegisterStructureHref("lease-to-own")).toBe("/talisu/reg?structure=lease-to-own");
    expect(talisURegisterStructureHref("lease-to-own,tokenization")).toBe("/talisu/reg");
    expect(talisURegisterStructureHref("nope")).toBe("/talisu/reg");
    expect(talisURegisterCheckoutHref()).toBe("/talisu/reg?step=register");
    expect(talisURegisterCheckoutHref("Tokenization")).toBe("/talisu/reg?step=register&structure=tokenization");
    expect(talisURegisterCheckoutHref(["lease-to-own", "tokenization"])).toBe("/talisu/reg?step=register");
    expect(talisURegisterCheckoutHref("lease-to-own,tokenization")).toBe("/talisu/reg?step=register");
    expect(talisURegisterCheckoutHref("evil")).toBe("/talisu/reg?step=register");
    expect(registerLockedHref()).toBe("/talisu/reg?locked=structure");
    expect(normalizeRegisterLockReason("Structure")).toBe("structure");
    expect(normalizeRegisterLockReason("design")).toBeNull();
    expect(registerStructureCheckoutUrl(BASE, null)).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "evil")).toBe(BASE);
    expect(registerStructureCheckoutUrl(BASE, "lease-to-own,tokenization")).toBe(BASE);
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
    env.entry = true;
  });

  it("uses the adviser layout with Aisha and loads with no structure selected", async () => {
    const tree = await renderReg({ step: "choose" });
    const layout = findAll(tree, (el) => el.type === AdviserLayout)[0];
    expect(layout.props.imageSrc).toBe("/images/mapsites/aisha-c.webp");
    expect(layout.props.title).toBe(en.talisu.register.adviserTitle);
    const tabs = findAll(tree, (el) => el.type === RegisterStructureTabs)[0];
    expect(tabs.props.initialId).toBeNull();
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("ignores an older remembered structure on load", async () => {
    env.cookie = "conventional";
    const tree = await renderReg({ step: "choose" });
    expect(findAll(tree, (el) => el.type === RegisterStructureTabs)[0].props.initialId).toBeNull();
    const html = renderToStaticMarkup(tree as ReactElement);
    expect(html).toContain('data-selected-structure=""');
    expect(html).not.toContain('data-selected="true"');
  });

  it("locked with none: a radiogroup of four unchecked radios, a disabled Register button and the reason", async () => {
    const html = renderToStaticMarkup((await renderReg({ step: "choose" })) as ReactElement);
    expect(html).toMatch(/role="radiogroup" aria-label="Choose your structure"/);
    for (const id of REGISTER_STRUCTURE_IDS) {
      expect(html).toMatch(
        new RegExp(`<button type="button" data-testid="register-structures-${id}"[^>]*data-selected="false" role="radio" aria-checked="false"`),
      );
    }
    expect(html).not.toContain("aria-pressed");
    // Roving focus: only the first radio is tabbable when none is chosen.
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-testid="partner-cta" data-locked="structure"/);
    expect(html).toContain("Choose a structure");
    expect(html).toContain('data-testid="register-lock-reason-structure"');
    expect(html).not.toContain('data-testid="register-structures-panel"');
    expect(hrefs(html).some((h) => h.includes("step=register"))).toBe(false);
  });

  it("unlocked with one: ?structure= pre-selects it and the Register link carries it", async () => {
    for (const id of REGISTER_STRUCTURE_IDS) {
      const html = renderToStaticMarkup((await renderReg({ structure: id })) as ReactElement);
      expect(html).toMatch(new RegExp(`data-testid="register-structures-${id}"[^>]*data-selected="true" role="radio" aria-checked="true"`));
      expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
      expect(html.match(/-check"/g)).toHaveLength(1);
      expect(html).toContain(`data-testid="register-structures-${id}-check"`);
      expect(html).toContain(`data-testid="register-structures-panel" data-structure-id="${id}"`);
      expect(hrefs(html)).toContain(`/talisu/reg?step=register&structure=${id}`);
      expect(html).not.toContain('data-locked="structure"');
      expect(html).not.toContain("Choose a structure");
      expect(html).toContain("Selected structure:");
    }
  });

  it("never multi-selects: a comma list in ?structure= pre-selects nothing and stays locked", async () => {
    const html = renderToStaticMarkup(
      (await renderReg({ structure: "lease-to-own,tokenization" })) as ReactElement,
    );
    expect(html).toContain('data-selected-structure=""');
    expect(html).not.toContain('aria-checked="true"');
    expect(html).toContain('data-locked="structure"');
    expect(html).not.toContain("Selected structures");
  });

  it("shows the bounce reason as an alert after a checkout URL without a structure", async () => {
    const html = renderToStaticMarkup((await renderReg({ locked: "structure" })) as ReactElement);
    expect(html).toMatch(/role="alert"[^>]*data-testid="register-lock-status"/);
    expect(html).toContain("Choose a structure");
  });

  it("shows the German tab names and reason", async () => {
    env.locale = "de";
    let html = renderToStaticMarkup((await renderReg({ step: "choose" })) as ReactElement);
    expect(html).toContain("Wählen Sie eine Struktur");
    html = renderToStaticMarkup((await renderReg({ structure: "lease-to-own" })) as ReactElement);
    expect(html).toContain("Mietkauf");
    expect(html).toContain("Gewählte Struktur:");
    expect(html).not.toContain("Strukturen:");
    expect(html).toContain("Wählen Sie Ihre Struktur");
  });
});

describe("Aisha's register checkout keeps the structure", () => {
  beforeEach(() => {
    env.enforce.mockClear();
    env.locale = "en";
    env.cookie = undefined;
    env.entry = true;
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
      { step: "register", structure: "lease-to-own,tokenization" },
      { step: "register", structure: "conventional%2Ctokenization" },
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

  it("a comma list redirects even when a valid structure is remembered", async () => {
    env.cookie = "conventional";
    for (const structure of ["lease-to-own,tokenization", "tokenization,", "evil"]) {
      await expect(renderReg({ step: "register", structure })).rejects.toThrow(
        "NEXT_REDIRECT;/talisu/reg?locked=structure",
      );
    }
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("an old multi-value cookie does not unlock the checkout", async () => {
    env.cookie = "lease-to-own%2Ctokenization";
    await expect(renderReg({ step: "register" })).rejects.toThrow("NEXT_REDIRECT;/talisu/reg?locked=structure");
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

  it("keeps every tab label on one line, never truncated, and the check badge off the label", async () => {
    const tabs = readFileSync(resolve("components/talisu/RegisterStructureTabs.tsx"), "utf8");
    expect(tabs).toMatch(/const TAB_LABEL =\s*"[^"]*whitespace-nowrap/);
    expect(tabs).not.toMatch(/truncate|text-ellipsis|line-clamp/);
    // Four-across only when it fits, columns never narrower than their label.
    expect(tabs).toContain("@container");
    expect(tabs).toContain("@min-[34rem]:grid-cols-[repeat(4,minmax(max-content,1fr))]");
    expect(tabs).toContain("@min-[19rem]:grid-cols-[repeat(2,minmax(max-content,1fr))]");
    // The shared metal style is reused unchanged.
    const metal = readFileSync(resolve("components/talisu/metal-tab.ts"), "utf8");
    expect(metal).toContain("overflow-hidden rounded-xl border px-2 py-2");
    for (const locale of ["en", "de"] as const) {
      env.locale = locale;
      for (const id of REGISTER_STRUCTURE_IDS) {
        const html = renderToStaticMarkup((await renderReg({ structure: id })) as ReactElement);
        // The badge is a sibling after the button (on the corner), not inside it.
        expect(html).toMatch(
          new RegExp(`data-testid="register-structures-${id}-label"[^>]*>[^<]+</span></button><span aria-hidden="true" data-testid="register-structures-${id}-check"[^>]*-right-2 -top-2`),
        );
      }
    }
  });

  it("keeps the client tabs writing the cookie and URL", () => {
    const tabs = readFileSync(resolve("components/talisu/RegisterStructureTabs.tsx"), "utf8");
    expect(tabs).toContain("rememberRegisterStructure(next)");
    expect(tabs).toContain("selectRegisterStructure(selected, id)");
    expect(tabs).toContain("talisURegisterCheckoutHref(selected)");
    expect(tabs).toContain('role="radiogroup"');
    expect(tabs).toContain("aria-checked={isSelected}");
    expect(tabs).not.toContain("aria-pressed");
    const lib = readFileSync(resolve("lib/talisu/register-structure.ts"), "utf8");
    expect(lib).toContain("registerStructureCookie(structure)");
    expect(lib).toContain("clearRegisterStructureCookie()");
    expect(lib).toContain("window.history.replaceState");
  });
});

describe("Aisha's /talisu/reg four buttons + agent entry code (Oct 31)", () => {
  beforeEach(() => {
    env.enforce.mockClear();
    env.locale = "en";
    env.cookie = undefined;
    env.entry = false;
  });

  it("bare landing: exactly four buttons in order Propose Project, Claim Market, Terms of Service, Register", async () => {
    for (const entry of [false, true]) {
      env.entry = entry;
      const tree = await renderReg({});
      expect(findAll(tree, (el) => el.type === RegisterStructureTabs)).toHaveLength(0);
      const actions = findAll(tree, (el) => el.type === RegisterActions)[0];
      expect(actions.props.hrefs).toEqual({
        propose: "/business-office/apply",
        claim: "/talispros/demo-mapsite",
        terms: "/talisu/contract",
        register: "/talisu/reg?step=choose",
      });
      expect(actions.props.entryGranted).toBe(entry);
      const html = renderToStaticMarkup(tree as ReactElement);
      const order = [...html.matchAll(/data-testid="register-action-(\w+)"/g)].map((m) => m[1]);
      expect(order).toEqual(["propose", "claim", "terms", "register"]);
      expect(html).toContain(">Propose Project<");
      expect(html).toContain(">Claim Market<");
      expect(html).toContain(">Terms of Service<");
      expect(html).toContain(">Register<");
      expect(html).not.toContain("register-structures-");
    }
  });

  it("German labels", async () => {
    env.locale = "de";
    const html = renderToStaticMarkup((await renderReg({})) as ReactElement);
    for (const label of ["Projekt vorschlagen", "Markt beanspruchen", "Nutzungsbedingungen", "Registrieren"]) {
      expect(html).toContain(`>${label}<`);
    }
  });

  it("without an entry code the structure step stays closed and the code prompt opens", async () => {
    const cases: Record<string, string>[] = [{ step: "choose" }, { structure: "tokenization" }, { locked: "structure" }, { locked: "code" }];
    for (const params of cases) {
      const tree = await renderReg(params);
      expect(findAll(tree, (el) => el.type === RegisterStructureTabs)).toHaveLength(0);
      expect(findAll(tree, (el) => el.type === RegisterActions)[0].props.initialOpen).toBe(true);
      const html = renderToStaticMarkup(tree as ReactElement);
      expect(html).toContain('data-testid="register-entry"');
      expect(html).toContain('data-testid="register-entry-code"');
    }
  });

  it("server side: the register checkout redirects to the code prompt before any other gate", async () => {
    await expect(renderReg({ step: "register", structure: "tokenization" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/reg?locked=code",
    );
    await expect(renderReg({ step: "register", structure: "conventional", fastCode: "ABC123" })).rejects.toThrow(
      "NEXT_REDIRECT;/talisu/reg?locked=code&fastCode=ABC123",
    );
    env.cookie = "fractionalization";
    await expect(renderReg({ step: "register" })).rejects.toThrow("NEXT_REDIRECT;/talisu/reg?locked=code");
    expect(env.enforce).not.toHaveBeenCalled();
  });

  it("validates codes with the existing agent code system, server-side, with a signed cookie", () => {
    const action = readFileSync(resolve("app/talisu/reg/actions.ts"), "utf8");
    expect(action).toContain('"use server"');
    expect(action).toContain("redeemAgentContractCode(");
    expect(action).toContain("signCookieValue(REGISTER_ENTRY_COOKIE_SCOPE");
    expect(action).toContain("httpOnly: true");
    const entry = readFileSync(resolve("lib/talisu/register-entry.ts"), "utf8");
    expect(entry).toContain('import "server-only"');
    expect(entry).toContain("verifyCookieValue(");
    expect(entry).toContain("getContractAgentById(");
    const ui = readFileSync(resolve("components/talisu/RegisterActions.tsx"), "utf8");
    expect(ui).not.toMatch(/placeholder=/);
    expect(ui).toContain("redeemRegisterEntryAction(");
  });
});
