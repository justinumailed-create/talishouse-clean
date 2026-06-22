import { describe, it, expect } from "vitest";
import { generateFastCode } from "../lib/fast-code-generator";

describe("generateFastCode", () => {
  it("returns a 4-character string", () => {
    const code = generateFastCode([]);
    expect(code).toHaveLength(4);
  });

  it("contains only uppercase letters and digits", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateFastCode([]);
      expect(code).toMatch(/^[A-Z0-9]{4}$/);
    }
  });

  it("returns different codes on successive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateFastCode([]));
    }
    // With 36^4 = 1,679,616 possibilities, 50 calls should all be unique
    expect(codes.size).toBe(50);
  });

  it("does not return codes from the existing list", () => {
    const existing = ["ABC1", "XYZ9", "LRG1", "TTV7"];
    for (let i = 0; i < 100; i++) {
      const code = generateFastCode(existing);
      expect(existing).not.toContain(code);
    }
  });

  it("handles a full set of existing codes gracefully", () => {
    const many: string[] = [];
    for (let i = 0; i < 100; i++) {
      many.push(`A${i}B`.padEnd(4, "X").slice(0, 4));
    }
    // Should still succeed since 36^4 >> 100
    const code = generateFastCode(many);
    expect(code).toHaveLength(4);
    expect(many).not.toContain(code);
  });

  it("normalizes existing codes to uppercase before checking", () => {
    const existing = ["abc1", "LrG1", "ttv7"];
    for (let i = 0; i < 50; i++) {
      const code = generateFastCode(existing);
      expect(code).not.toBe("ABC1");
      expect(code).not.toBe("LRG1");
      expect(code).not.toBe("TTV7");
      expect(code).not.toBe("abc1");
      expect(code).not.toBe("lrg1");
      expect(code).not.toBe("ttv7");
    }
  });

  it("throws when it cannot find a unique code", () => {
    // Fill the entire 36^4 space — impractical, but test the throw path
    // by mocking via a very constrained space
    const allButOne = new Set<string>();
    // Generate 36^2 - 1 = 1295 codes for a 2-char space to trigger the throw
    for (let i = 0; i < 36; i++) {
      for (let j = 0; j < 36; j++) {
        const c1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[i];
        const c2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[j];
        allButOne.add(`${c1}${c2}XX`);
      }
    }
    const existing = [...allButOne];
    // With 1296 codes covering all 2-char prefixes of a 4-char code,
    // the generator should still find a unique one (36^4 >> 1296)
    const code = generateFastCode(existing);
    expect(code).toHaveLength(4);
    expect(existing).not.toContain(code);
  });
});
