import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHECKOUT_AGENT_CODES,
  isCheckoutAgentCode,
  normalizeCheckoutAgentCode,
} from "../lib/talisu/checkout-codes";

describe("checkout agent codes", () => {
  it("allows exactly the memorable names plus demo", () => {
    expect([...CHECKOUT_AGENT_CODES]).toEqual(["aritri", "enanko", "ralf", "arun", "demo"]);
  });

  it("matches case-insensitively and trims surrounding spaces", () => {
    for (const code of ["aritri", "  Aritri", "ENANKO", " ralf ", "Arun", "DeMo"]) {
      expect(isCheckoutAgentCode(code)).toBe(true);
    }
    expect(normalizeCheckoutAgentCode("  Ralf\n")).toBe("ralf");
  });

  it("rejects anything outside the list", () => {
    for (const code of ["", "   ", "jonathan", "en anko", "demo1", "not-a-code", null, 3]) {
      expect(isCheckoutAgentCode(code)).toBe(false);
    }
  });

  it("checks the allowlist in the checkout action, and still redirects without a code", () => {
    const gate = readFileSync(resolve("lib/talispros/prospect-gate-server.ts"), "utf8");
    const start = gate.indexOf("export async function acceptAgentGateSecret");
    const body = gate.slice(start, gate.indexOf("export async function acceptGlobalAdminPassword"));
    expect(body).toContain("isCheckoutAgentCode(code)");
    expect(body).not.toContain("acceptSecret(");
    const page = readFileSync(resolve("components/talisu/RegisterProductCheckout.tsx"), "utf8");
    expect(page).toContain('redirect(`/talisu/reg?locked=code&product=${product}`)');
    expect(page.indexOf("hasCheckoutAccess()")).toBeLessThan(page.indexOf("<SamCartWebCheckout"));
  });
});
