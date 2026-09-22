import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractInitials,
  validateAndNormalizeFastCodeInput,
  FastCodeValidationError,
  normalizeNamePart,
  splitPersonName,
  validateNamePart,
} from "@/validators/fast-code.validator";
import {
  formatFastCode,
  generateFastCode,
  getNextFastCodeSequence,
} from "@/services/fast-code.service";

const mockAccountsLike = vi.fn();
const mockRegistrationsLike = vi.fn();
const mockMapSitesLike = vi.fn();
const mockFastCodesLike = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({
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

describe("normalizeNamePart", () => {
  it("strips accents and punctuation", () => {
    expect(normalizeNamePart("José")).toBe("jose");
    expect(normalizeNamePart("Jean-Pierre")).toBe("jean pierre");
    expect(normalizeNamePart("O'Connor")).toBe("oconnor");
  });
});

describe("validateNamePart", () => {
  it("rejects missing, numeric, and invalid values", () => {
    expect(() => validateNamePart("", "firstName")).toThrow(
      FastCodeValidationError
    );
    expect(() => validateNamePart("John3", "firstName")).toThrow(
      /cannot contain numbers/
    );
    expect(() => validateNamePart("John@", "firstName")).toThrow(
      /invalid characters/
    );
  });

  it("allows & and + between given names", () => {
    expect(validateNamePart("Lydia & Richard", "firstName")).toBe(
      "lydia & richard"
    );
    expect(validateNamePart("Lydia + Richard", "firstName")).toBe(
      "lydia + richard"
    );
    expect(validateNamePart("Lydia and Richard", "firstName")).toBe(
      "lydia and richard"
    );
  });
});

describe("extractInitials", () => {
  it("builds initials without a middle name", () => {
    const input = validateAndNormalizeFastCodeInput({
      firstName: "Rahul",
      lastName: "Das",
    });
    expect(extractInitials(input)).toBe("rd");
  });

  it("includes the middle name initial when present", () => {
    const input = validateAndNormalizeFastCodeInput({
      firstName: "Arun",
      middleName: "Kumar",
      lastName: "Rachuri",
    });
    expect(extractInitials(input)).toBe("akr");
  });

  it("normalizes accented and hyphenated names before deriving initials", () => {
    const input = validateAndNormalizeFastCodeInput({
      firstName: "José",
      middleName: "Jean-Pierre",
      lastName: "O'Connor",
    });
    expect(extractInitials(input)).toBe("jjo");
  });

  it("uses the first letter of each given name when & , + , or and separates them", () => {
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Lydia & Richard",
          lastName: "Gaertner",
        })
      )
    ).toBe("lrg");
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Lydia + Richard",
          lastName: "Gaertner",
        })
      )
    ).toBe("lrg");
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Lydia and Richard",
          lastName: "Gaertner",
        })
      )
    ).toBe("lrg");
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Lydia&Richard",
          lastName: "Gaertner",
        })
      )
    ).toBe("lrg");
  });

  it("keeps the issued 2–3 letter shape when there are more than two given names", () => {
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Lydia & Richard & Tom",
          lastName: "Gaertner",
        })
      )
    ).toBe("lrg");
  });

  it("does not treat and inside a given name as a separator", () => {
    expect(
      extractInitials(
        validateAndNormalizeFastCodeInput({
          firstName: "Andrew",
          lastName: "Smith",
        })
      )
    ).toBe("as");
  });
});

describe("splitPersonName", () => {
  it("keeps a shared surname after & , + , or and", () => {
    expect(splitPersonName("Lydia & Richard Gaertner")).toEqual({
      firstName: "Lydia & Richard",
      lastName: "Gaertner",
    });
    expect(splitPersonName("Lydia + Richard Gaertner")).toEqual({
      firstName: "Lydia + Richard",
      lastName: "Gaertner",
    });
    expect(splitPersonName("Lydia and Richard Gaertner")).toEqual({
      firstName: "Lydia and Richard",
      lastName: "Gaertner",
    });
  });

  it("still splits a single-person name on the first space", () => {
    expect(splitPersonName("Rahul Das")).toEqual({
      firstName: "Rahul",
      lastName: "Das",
    });
  });
});

describe("getNextFastCodeSequence", () => {
  it("increments within the same prefix only", () => {
    expect(getNextFastCodeSequence("rd", ["rd01", "rd02", "ab01"])).toBe(3);
    expect(getNextFastCodeSequence("rd", ["rd01", "ab02", "xy03"])).toBe(2);
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

  it("generates rd01 without a middle name", async () => {
    await expect(
      generateFastCode({ firstName: "Rahul", lastName: "Das" })
    ).resolves.toBe("rd01");
  });

  it("generates akr01 with a middle name", async () => {
    await expect(
      generateFastCode({
        firstName: "Arun",
        middleName: "Kumar",
        lastName: "Rachuri",
      })
    ).resolves.toBe("akr01");
  });

  it("assigns the next sequence for duplicate initials", async () => {
    mockAccountsLike.mockResolvedValue({
      data: [{ fast_code: "rd01" }, { fast_code: "rd02" }],
      error: null,
    });

    await expect(
      generateFastCode({ firstName: "Rahul", lastName: "Das" })
    ).resolves.toBe("rd03");
  });

  it("returns lowercase codes", async () => {
    const code = await generateFastCode({
      firstName: "LYDIA",
      middleName: "RICHARD",
      lastName: "GAERTNER",
    });

    expect(code).toBe("lrg01");
    expect(code).toMatch(/^[a-z]{2,3}\d{2}$/);
  });

  it("turns multi-person names into letters and digits only", async () => {
    const cases = [
      { firstName: "Lydia & Richard", lastName: "Gaertner" },
      { firstName: "Lydia + Richard", lastName: "Gaertner" },
      { firstName: "Lydia and Richard", lastName: "Gaertner" },
    ];

    for (const input of cases) {
      const code = await generateFastCode(input);
      expect(code).toBe("lrg01");
      expect(code).toMatch(/^[a-z]{2,3}\d{2}$/);
      expect(code).not.toMatch(/[&+\s']/);
    }

    const display = splitPersonName("Lydia & Richard Gaertner");
    await expect(generateFastCode(display)).resolves.toBe("lrg01");
  });

  it("rejects invalid input", async () => {
    await expect(
      generateFastCode({ firstName: "Rahul1", lastName: "Das" })
    ).rejects.toBeInstanceOf(FastCodeValidationError);
  });
});

describe("formatFastCode", () => {
  it("formats two-digit sequences", () => {
    expect(formatFastCode("rd", 4)).toBe("rd04");
  });

  it("rejects prefixes that are not 2–3 letters", () => {
    expect(() => formatFastCode("lr&", 1)).toThrow(/2–3 letters/);
    expect(() => formatFastCode("lrgx", 1)).toThrow(/2–3 letters/);
  });
});
