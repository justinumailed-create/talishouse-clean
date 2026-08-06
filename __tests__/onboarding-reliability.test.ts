import { describe, expect, it, vi } from "vitest";
import { buildSelfEbookContinueHref } from "@/lib/talispros/ebook-choice";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import {
  OnboardingTimeoutError,
  withOnboardingTimeout,
  formatOnboardingDuration,
  ONBOARDING_SLOW_MS,
  ONBOARDING_CRITICAL_MS,
} from "@/lib/onboarding-timing";

describe("onboarding reliability — browser-state independence", () => {
  it("buildSelfEbookContinueHref uses requestId only when present", () => {
    const href = buildSelfEbookContinueHref({
      requestId: "req-123",
      fastCode: "ar01",
      mapsiteId: "ms-abc",
      accountType: "root-1",
    });
    expect(href).toBe("/talispros/ebook-generate?requestId=req-123");
    expect(href).not.toContain("fastCode");
    expect(href).not.toContain("mapsiteId");
    expect(href).not.toContain("accountType");
  });

  it("buildSelfEbookContinueHref legacy fallback omits empty params", () => {
    expect(buildSelfEbookContinueHref({})).toBe("/talispros/ebook-generate");
    expect(
      buildSelfEbookContinueHref({ fastCode: "ar01" })
    ).toBe("/talispros/ebook-generate?fastCode=ar01");
  });

  it("isIssuedFastCode accepts only initials+sequence shapes", () => {
    expect(isIssuedFastCode("ar01")).toBe(true);
    expect(isIssuedFastCode("JMD03")).toBe(true);
    expect(isIssuedFastCode("msabc123")).toBe(false);
    expect(isIssuedFastCode("demo")).toBe(false);
    expect(isIssuedFastCode("")).toBe(false);
    expect(isIssuedFastCode(null)).toBe(false);
  });

  it("withOnboardingTimeout rejects after the deadline", async () => {
    await expect(
      withOnboardingTimeout("Image optimisation", 50, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return "done";
      })
    ).rejects.toBeInstanceOf(OnboardingTimeoutError);
  });

  it("withOnboardingTimeout resolves when work finishes in time", async () => {
    const value = await withOnboardingTimeout("FAST generation", 200, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "ar01";
    });
    expect(value).toBe("ar01");
  });

  it("duration formatter and thresholds are defined for SLOW/CRITICAL", () => {
    expect(formatOnboardingDuration(35)).toBe("35 ms");
    expect(formatOnboardingDuration(2100)).toMatch(/2\.10 s|2\.1 s/);
    expect(ONBOARDING_SLOW_MS).toBe(5_000);
    expect(ONBOARDING_CRITICAL_MS).toBe(30_000);
  });
});

describe("onboarding resolver contract", () => {
  it("fails closed when requestId is missing without touching browser storage", async () => {
    vi.resetModules();
    const { resolveOnboardingFromRequest } = await import(
      "@/lib/talispros/resolve-onboarding-from-request"
    );
    const result = await resolveOnboardingFromRequest(null);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.report.stage).toBe("resolve_request");
    expect(result.report.error).toMatch(/Build Request ID is required/i);
  });
});
