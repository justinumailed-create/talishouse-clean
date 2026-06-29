import { describe, it, expect } from "vitest";
import { generateFastCode } from "../lib/fast-code-generator";

const LEGACY_FAST_CODE_PATTERN = /^[A-Z]{2}-[A-Z]{3}-\d{4}$/;

describe("generateFastCode (legacy random format)", () => {
  it("returns a code in XX-XXX-XXXX format", () => {
    const code = generateFastCode([]);
    expect(code).toMatch(LEGACY_FAST_CODE_PATTERN);
  });

  it("contains only uppercase letters and digits in the expected segments", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateFastCode([]);
      expect(code).toMatch(LEGACY_FAST_CODE_PATTERN);
    }
  });

  it("returns different codes on successive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateFastCode([]));
    }
    expect(codes.size).toBe(50);
  });

  it("does not return codes from the existing list", () => {
    const existing = ["AB-CDE-1234", "XY-ZAB-9876", "LR-GAB-0001"];
    for (let i = 0; i < 100; i++) {
      const code = generateFastCode(existing);
      expect(existing).not.toContain(code);
    }
  });

  it("handles many existing codes gracefully", () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      `A${String(i).padStart(1, "0")}-BCD-${String(1000 + i).padStart(4, "0")}`.slice(0, 11)
    );
    const code = generateFastCode(many);
    expect(code).toMatch(LEGACY_FAST_CODE_PATTERN);
    expect(many).not.toContain(code);
  });

  it("normalizes existing codes to uppercase before checking", () => {
    const existing = ["ab-cde-1234", "Xy-Zab-9876"];
    for (let i = 0; i < 50; i++) {
      const code = generateFastCode(existing);
      expect(code).not.toBe("AB-CDE-1234");
      expect(code).not.toBe("XY-ZAB-9876");
      expect(code).not.toBe("ab-cde-1234");
      expect(code).not.toBe("xy-zab-9876");
    }
  });

  it("finds a unique code even when many prefixes are taken", () => {
    const existing = Array.from({ length: 200 }, (_, i) => {
      const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i % 26];
      const b = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[(i + 3) % 26];
      return `${a}${b}-AAA-0001`;
    });
    const code = generateFastCode(existing);
    expect(code).toMatch(LEGACY_FAST_CODE_PATTERN);
    expect(existing).not.toContain(code);
  });
});
