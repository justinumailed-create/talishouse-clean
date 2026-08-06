import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildSelfEbookContinueHref } from "@/lib/talispros/ebook-choice";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import {
  OnboardingTimeoutError,
  withOnboardingTimeout,
} from "@/lib/onboarding-timing";
import { runEbookGenerationPipeline } from "@/lib/talispros/ebook-generation-pipeline";

vi.mock("@/lib/talispros/resolve-onboarding-from-request", () => ({
  resolveOnboardingFromRequest: vi.fn(),
}));

vi.mock("@/lib/talisbooks/self-service-ebook", () => ({
  generateSelfServiceEbook: vi.fn(),
}));

import { resolveOnboardingFromRequest } from "@/lib/talispros/resolve-onboarding-from-request";
import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";

const resolveMock = vi.mocked(resolveOnboardingFromRequest);
const generateMock = vi.mocked(generateSelfServiceEbook);

function tinyPngFile(name = "test.png"): File {
  // 1x1 transparent PNG
  const bytes = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    ),
    (c) => c.charCodeAt(0)
  );
  return new File([bytes], name, { type: "image/png" });
}

describe("failure recovery — structured errors", () => {
  beforeEach(() => {
    resolveMock.mockReset();
    generateMock.mockReset();
  });

  it("missing requestId returns structured failure (no hang)", async () => {
    const result = await runEbookGenerationPipeline({
      requestId: "",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 5_000,
    });
    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.requestId).toBeNull();
    expect(result.failedStage).toBe("resolve_request");
    expect(result.error).toMatch(/Build Request ID/i);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("invalid requestId / missing build request returns stage + message", async () => {
    resolveMock.mockResolvedValue({
      ok: false,
      report: {
        requestId: "missing-req",
        fastCode: null,
        mapsiteId: null,
        stage: "validate_build_request",
        error: "Build Request not found. Restart onboarding from the Build Form.",
        durationMs: 12,
      },
    });

    const result = await runEbookGenerationPipeline({
      requestId: "missing-req",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 5_000,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.requestId).toBe("missing-req");
    expect(result.failedStage).toBe("validate_build_request");
    expect(result.error).toMatch(/not found/i);
  });

  it("missing FAST Code fails closed with resolve_fast_code stage", async () => {
    resolveMock.mockResolvedValue({
      ok: false,
      report: {
        requestId: "req-1",
        fastCode: null,
        mapsiteId: "ms-1",
        stage: "resolve_fast_code",
        error:
          "FAST Code was not issued for this Build Request. Resubmit the Build Form — the E-Book generator cannot invent a FAST Code.",
        durationMs: 8,
      },
    });

    const result = await runEbookGenerationPipeline({
      requestId: "req-1",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 5_000,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.failedStage).toBe("resolve_fast_code");
    expect(result.mapsiteId).toBe("ms-1");
    expect(result.error).toMatch(/FAST Code was not issued/i);
  });

  it("owner identity missing fails at validate_owner", async () => {
    resolveMock.mockResolvedValue({
      ok: false,
      report: {
        requestId: "req-2",
        fastCode: null,
        mapsiteId: null,
        stage: "validate_owner",
        error:
          "Build Request is missing owner identity (name/email). Resubmit the Build Form.",
        durationMs: 5,
      },
    });

    const result = await runEbookGenerationPipeline({
      requestId: "req-2",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 5_000,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.failedStage).toBe("validate_owner");
  });

  it("book generation failure returns generating_pages stage", async () => {
    resolveMock.mockResolvedValue({
      ok: true,
      context: {
        requestId: "req-3",
        fastCode: "ar01",
        mapsiteId: "ms-3",
        accountType: "root-1",
        owner: {
          firstName: "Ada",
          lastName: "Lovelace",
          agentName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "",
        },
        assets: { coverImage: null, galleryImages: [], logo: null },
        pin: {
          streetAddress: "1 Main",
          latitude: 1,
          longitude: 2,
          writeup: null,
        },
      },
    });
    generateMock.mockResolvedValue({
      success: false,
      error: "Could not process property images. Try JPG or PNG files.",
    });

    const result = await runEbookGenerationPipeline({
      requestId: "req-3",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 5_000,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.requestId).toBe("req-3");
    expect(result.fastCode).toBe("ar01");
    expect(result.mapsiteId).toBe("ms-3");
    expect(result.failedStage).toBe("generating_pages");
    expect(result.error).toMatch(/Could not process/i);
  });

  it("book generation timeout returns structured timeout error", async () => {
    resolveMock.mockResolvedValue({
      ok: true,
      context: {
        requestId: "req-4",
        fastCode: "ar01",
        mapsiteId: "ms-4",
        accountType: "root-1",
        owner: {
          firstName: "Ada",
          lastName: "Lovelace",
          agentName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "",
        },
        assets: { coverImage: null, galleryImages: [], logo: null },
        pin: {
          streetAddress: null,
          latitude: null,
          longitude: null,
          writeup: null,
        },
      },
    });
    generateMock.mockImplementation(
      () =>
        new Promise(() => {
          /* hang until timeout */
        }) as never
    );

    const result = await runEbookGenerationPipeline({
      requestId: "req-4",
      title: "T",
      description: "D",
      location: "L",
      images: [tinyPngFile()],
      uploadMode: "images",
      timeoutMs: 80,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.error).toMatch(/timed out/i);
    expect(result.requestId).toBe("req-4");
    expect(result.fastCode).toBe("ar01");
  });

  it("empty images fails at uploading_images", async () => {
    resolveMock.mockResolvedValue({
      ok: true,
      context: {
        requestId: "req-5",
        fastCode: "ar01",
        mapsiteId: "ms-5",
        accountType: "root-1",
        owner: {
          firstName: "Ada",
          lastName: "Lovelace",
          agentName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "",
        },
        assets: { coverImage: null, galleryImages: [], logo: null },
        pin: {
          streetAddress: null,
          latitude: null,
          longitude: null,
          writeup: null,
        },
      },
    });

    const result = await runEbookGenerationPipeline({
      requestId: "req-5",
      title: "T",
      description: "D",
      location: "L",
      images: [],
      uploadMode: "images",
      timeoutMs: 5_000,
    });

    expect(result.stage).toBe("failed");
    if (result.stage !== "failed") return;
    expect(result.failedStage).toBe("uploading_images");
  });
});

describe("security — FAST spoofing & handoff shape", () => {
  it("redirect URL never embeds client-supplied FAST Code when requestId exists", () => {
    const href = buildSelfEbookContinueHref({
      requestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      fastCode: "zz99",
      mapsiteId: "other-users-mapsite",
    });
    expect(href).toBe(
      "/talispros/ebook-generate?requestId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    );
    expect(href).not.toContain("fastCode");
    expect(href).not.toContain("mapsiteId");
  });

  it("provisional / spoofed FAST shapes are rejected", () => {
    expect(isIssuedFastCode("zz99")).toBe(true); // shape-valid but still DB-verified later
    expect(isIssuedFastCode("msfake01")).toBe(false);
    expect(isIssuedFastCode("attacker")).toBe(false);
  });

  it("withOnboardingTimeout never hangs", async () => {
    await expect(
      withOnboardingTimeout("Storage upload", 40, () => new Promise(() => {}))
    ).rejects.toBeInstanceOf(OnboardingTimeoutError);
  });
});
