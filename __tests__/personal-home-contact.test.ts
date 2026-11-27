import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allowContactReveal,
  CONTACT_REVEAL_MAX_PER_IP,
  isSameOriginRequest,
  parseContactRevealBody,
  resetContactRevealRateLimitForTests,
} from "../lib/talispros/personal-home-contact";

function repo(relativePath: string) {
  return readFileSync(join(__dirname, "..", relativePath), "utf8");
}

describe("personal home contact reveal", () => {
  beforeEach(() => {
    resetContactRevealRateLimitForTests();
  });

  it("parses a reveal request and rejects invalid bodies", () => {
    expect(parseContactRevealBody({ code: "RM22", field: "phone" })).toEqual({
      code: "rm22",
      field: "phone",
      surface: "home",
    });
    expect(parseContactRevealBody({ slug: "RM22", field: "email", surface: "mapsite" })).toEqual({
      code: "rm22",
      field: "email",
      surface: "mapsite",
    });
    expect(parseContactRevealBody({ fastCode: "dc06", field: "phone" })?.code).toBe("dc06");
    expect(parseContactRevealBody({ code: "rm22", field: "fax" })).toBeNull();
    expect(parseContactRevealBody({ field: "phone" })).toBeNull();
    expect(parseContactRevealBody({ code: "x".repeat(80), field: "phone" })).toBeNull();
  });

  it("rate-limits repeated reveals per IP", () => {
    const ip = "203.0.113.10";
    for (let i = 0; i < CONTACT_REVEAL_MAX_PER_IP; i += 1) {
      expect(allowContactReveal(ip)).toBe(true);
    }
    expect(allowContactReveal(ip)).toBe(false);
    expect(allowContactReveal("203.0.113.11")).toBe(true);
  });

  it("requires a same-origin request", () => {
    const url = "https://www.tsplits.com/api/personal-home/contact";
    expect(
      isSameOriginRequest(
        new Request(url, { headers: { origin: "https://www.tsplits.com" } }),
      ),
    ).toBe(true);
    expect(
      isSameOriginRequest(
        new Request(url, { headers: { origin: "https://evil.example" } }),
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        new Request(url, { headers: { referer: "https://www.tsplits.com/home/rm22" } }),
      ),
    ).toBe(true);
  });

  it("wires the API route to same-origin and per-IP rate limiting", () => {
    const route = repo("app/api/personal-home/contact/route.ts");
    expect(route).toContain("isSameOriginRequest");
    expect(route).toContain("allowContactReveal");
    expect(route).toContain("lookupPublicContactValue");
    expect(route).toContain("parseContactRevealBody");
    expect(route).toContain("status: 403");
    expect(route).toContain("status: 429");
    expect(route).toContain("field: input.field, value");
  });

  it("keeps plaintext phone and email out of public SSR props", () => {
    const home = repo("app/home/[fastCode]/page.tsx");
    expect(home).toContain("hasPhone={Boolean(resolved.contactPhone)}");
    expect(home).toContain("hasEmail={Boolean(resolved.contactEmail)}");
    expect(home).not.toContain("contactPhone={resolved.contactPhone}");
    expect(home).not.toContain("contactEmail={resolved.contactEmail}");
    expect(home).toContain("fastCode={data.code}");

    const body = repo("components/talispros/personal-home/PersonalHomeBody.tsx");
    expect(body).toContain("ProtectedContactReveal");
    expect(body).toContain("hasPhone");
    expect(body).toContain("hasEmail");
    expect(body).not.toContain("contactPhone?:");
    expect(body).not.toContain("contactEmail?:");

    const pageType = repo("lib/talispros/personal-home-page.ts");
    expect(pageType).toContain("hasPhone: boolean");
    expect(pageType).toContain("hasEmail: boolean");
    expect(pageType).not.toMatch(/export type PersonalHomePublicCard = \{[\s\S]*phone: string/);

    const topBar = repo("components/mapsite/MapSiteTopBar.tsx");
    expect(topBar).toContain("ProtectedContactReveal");
    expect(topBar).not.toContain("mailto:");
    expect(topBar).not.toContain("tel:${");

    const footer = repo("components/mapsite/MapSiteFooter.tsx");
    expect(footer).toContain("ProtectedContactReveal");
    expect(footer).not.toContain("email &&");
    expect(footer).not.toMatch(/\{email\}/);

    const layout = repo("components/mapsite/MapSiteLayout.tsx");
    expect(layout).toContain("hasPhone={Boolean(data.agent.phone?.trim())}");
    expect(layout).toContain('agent={{ ...data.agent, email: "", phone: "" }}');
  });
});
