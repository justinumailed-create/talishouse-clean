import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Oct 31 contract bug: the Service Agreement showed one signer's completed
// contract (banner with their name) to anyone whose browser resolved the same
// FAST Code, and sent visitors without a FAST Code away. Each visitor now gets
// their own blank contract; only the signer's own browser sees the banner.
const env = vi.hoisted(() => ({
  signedCookieId: null as string | null,
  visitorFastCode: null as string | null,
  claimed: new Set<string>(),
  agent: null as { id: string; name: string } | null,
  records: new Map<string, { id: string; fastCode: string; signerName: string; signedAt: string }>(),
  recorded: [] as unknown[],
  setCookie: vi.fn(),
}));

vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en" }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
  cookies: async () => ({
    get: (name: string) => {
      if (name === "talis_contract_signed" && env.signedCookieId) return { name, value: `signed:${env.signedCookieId}` };
      if (name === "talis_contract_agent" && env.agent) return { name, value: `agent:${env.agent.id}` };
      return undefined;
    },
    set: env.setCookie,
    delete: vi.fn(),
  }),
}));
vi.mock("@/lib/talisu/pmc-gate", () => ({
  PMC_CLAIM_START: "/talispros/demo-mapsite",
  findClaimedMapSite: async (code: string | null | undefined) => {
    const c = code?.trim().toLowerCase();
    return c && env.claimed.has(c) ? { id: `m-${c}`, fastCode: c } : null;
  },
  resolveVisitorFastCode: async (explicit?: string | null) => explicit || env.visitorFastCode,
}));
vi.mock("@/lib/talispros/mapsite-contract-service", () => ({
  CONTRACT_AGENT_COOKIE: "talis_contract_agent",
  CONTRACT_AGENT_COOKIE_MAX_AGE: 1,
  CONTRACT_SIGNED_COOKIE: "talis_contract_signed",
  CONTRACT_SIGNED_COOKIE_MAX_AGE: 1,
  verifyCookieValue: (scope: string, v?: string) => (v?.startsWith(`${scope}:`) ? v.slice(scope.length + 1) : null),
  signCookieValue: (scope: string, id: string) => `${scope}:${id}`,
  getContractAgentById: async () => env.agent,
  getSignedContractById: async (id: string) => env.records.get(id) ?? null,
  redeemAgentContractCode: vi.fn(),
  recordServiceAgreementSignature: async (input: unknown) => {
    env.recorded.push(input);
    return { id: "new-record" };
  },
}));
vi.mock("@/components/talisu/pmc/ContractClient", () => ({
  ContractUnlockForm: () => <div data-testid="stub-unlock" />,
  ContractSignForm: ({ fastCode }: { fastCode: string | null }) => (
    <div data-testid="stub-sign" data-fast-code={fastCode ?? ""} />
  ),
}));
vi.mock("@/components/talisu/pmc/PmcStepper", () => ({ default: () => null }));
vi.mock("@/components/talisu/pmc/PmcFooter", () => ({ default: () => null }));

import PmcContractPage from "../app/talisu/contract/page";
import { signPmcContractAction } from "../app/talisu/contract/actions";

const render = async (params: Record<string, string> = {}) =>
  renderToStaticMarkup((await PmcContractPage({ searchParams: Promise.resolve(params) })) as ReactElement);

const SIGNED = { id: "rec-1", fastCode: "zz9test", signerName: "Signer One", signedAt: "2026-10-20T10:00:00Z" };

describe("Service Agreement is per signer", () => {
  beforeEach(() => {
    env.signedCookieId = null;
    env.visitorFastCode = null;
    env.claimed = new Set(["zz9test", "yy8test"]);
    env.agent = null;
    env.records = new Map([[SIGNED.id, SIGNED]]);
    env.recorded = [];
    env.setCookie.mockClear();
  });

  it("a fresh logged-out visitor gets the blank agreement (no redirect, no banner)", async () => {
    const html = await render();
    expect(html).toContain('data-testid="stub-unlock"');
    expect(html).not.toContain("Signer One");
    env.agent = { id: "a1", name: "Agent" };
    const signable = await render();
    expect(signable).toContain('data-testid="stub-sign" data-fast-code=""');
  });

  it("someone else with the same FAST Code (owner cookie or link) does not see the signer's banner", async () => {
    env.visitorFastCode = "zz9test";
    env.agent = { id: "a1", name: "Agent" };
    for (const html of [await render(), await render({ fastCode: "zz9test" })]) {
      expect(html).not.toContain("Signer One");
      expect(html).toContain('data-testid="stub-sign" data-fast-code="zz9test"');
    }
  });

  it("only the signer's own browser sees the completed contract, and can start a new one", async () => {
    env.signedCookieId = SIGNED.id;
    const html = await render();
    expect(html).toContain("Signer One");
    expect(html).toContain('data-testid="pmc-contract-new"');
    expect(await render({ fastCode: "yy8test" })).not.toContain("Signer One");
    expect(await render({ new: "1" })).not.toContain("Signer One");
  });

  it("signing records a new contract for a new signer and never touches the existing one", async () => {
    env.agent = { id: "a1", name: "Agent" };
    const input = {
      signerName: "New Signer",
      signerBusiness: "",
      signerEmail: "",
      fastCode: "ZZ9TEST",
      signatureType: "typed" as const,
      signatureText: "New Signer",
      signatureImage: null,
      consent: true,
    };
    const res = await signPmcContractAction(input);
    expect(res.ok).toBe(true);
    expect(env.recorded).toHaveLength(1);
    expect(env.records.get(SIGNED.id)).toEqual(SIGNED);
    expect(env.setCookie).toHaveBeenCalledWith("talis_contract_signed", "signed:new-record", expect.anything());

    // The signer's own browser re-submitting just continues (no duplicate).
    env.recorded = [];
    env.signedCookieId = SIGNED.id;
    expect((await signPmcContractAction(input)).ok).toBe(true);
    expect(env.recorded).toHaveLength(0);

    // Unclaimed FAST Codes are refused server-side.
    env.signedCookieId = null;
    expect(await signPmcContractAction({ ...input, fastCode: "NOPE00" })).toEqual({ ok: false, error: "needFastCode" });
  });
});
