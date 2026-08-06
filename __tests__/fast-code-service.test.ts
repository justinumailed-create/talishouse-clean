import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractInitials,
  formatFastCode,
  generateFastCode,
  getNextFastCodeSequence,
  validateAndNormalizeFastCodeInput,
} from "../lib/fast-code-service";

const mockAccountsLike = vi.fn();
const mockRegistrationsLike = vi.fn();
const mockMapSitesLike = vi.fn();
const mockFastCodesLike = vi.fn();

vi.mock("../lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "accounts") {
        return {
          select: () => ({
            like: mockAccountsLike,
          }),
        };
      }

      if (table === "fast_code_registrations") {
        return {
          select: () => ({
            like: mockRegistrationsLike,
          }),
        };
      }

      if (table === "mapsites") {
        return {
          select: () => ({
            like: mockMapSitesLike,
          }),
        };
      }

      if (table === "fast_codes") {
        return {
          select: () => ({
            like: mockFastCodesLike,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe("extractInitials", () => {
  it("builds initials without a middle name", () => {
    const input = validateAndNormalizeFastCodeInput({
      firstName: "Arun",
      lastName: "Rachuri",
    });
    expect(extractInitials(input)).toBe("ar");
  });

  it("includes the middle name initial when present", () => {
    const input = validateAndNormalizeFastCodeInput({
      firstName: "Arun",
      middleName: "Kumar",
      lastName: "Rachuri",
    });
    expect(extractInitials(input)).toBe("akr");
  });
});

describe("formatFastCode", () => {
  it("formats codes with a two-digit sequence", () => {
    expect(formatFastCode("rd", 1)).toBe("rd01");
    expect(formatFastCode("rd", 2)).toBe("rd02");
  });
});

describe("getNextFastCodeSequence", () => {
  it("starts at 01 when no codes exist for the prefix", () => {
    expect(getNextFastCodeSequence("rd", [])).toBe(1);
  });

  it("increments the sequence for duplicate initials", () => {
    const existing = ["rd01", "rd02", "ab01"];
    expect(getNextFastCodeSequence("rd", existing)).toBe(3);
  });
});

describe("generateFastCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountsLike.mockResolvedValue({ data: [], error: null });
    mockRegistrationsLike.mockResolvedValue({ data: [], error: null });
    mockMapSitesLike.mockResolvedValue({ data: [], error: null });
    mockFastCodesLike.mockResolvedValue({ data: [], error: null });
  });

  it("returns the first code for a prefix with no middle name", async () => {
    const code = await generateFastCode({
      firstName: "Arun",
      lastName: "Rachuri",
    });

    expect(code).toBe("ar01");
    expect(mockAccountsLike).toHaveBeenCalledWith("fast_code", "ar%");
  });

  it("assigns the next sequence for duplicate initials", async () => {
    mockAccountsLike.mockResolvedValue({
      data: [{ fast_code: "rd01" }, { fast_code: "rd02" }],
      error: null,
    });

    const code = await generateFastCode({
      firstName: "Rahul",
      lastName: "Das",
    });

    expect(code).toBe("rd03");
  });
});
