import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  generateTemporaryPassword,
  isAgentSessionTokenShape,
  isValidLoginId,
  normalizeLoginId,
  validateNewPassword,
} from "../lib/agent-admins";

describe("agent passwords", () => {
  it("generates strong temporary passwords that pass policy", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const pw = generateTemporaryPassword();
      expect(pw).toHaveLength(16);
      seen.add(pw);
    }
    expect(seen.size).toBe(50);
  });

  it("enforces password policy", () => {
    expect(validateNewPassword("short1A")).not.toBeNull();
    expect(validateNewPassword("alllowercase123")).not.toBeNull();
    expect(validateNewPassword("GoodPassword123")).toBeNull();
  });

  it("round-trips bcrypt hashes", async () => {
    const hash = await bcrypt.hash("GoodPassword123", 4);
    expect(hash).not.toContain("GoodPassword123");
    expect(await bcrypt.compare("GoodPassword123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  it("validates login IDs and token shapes", () => {
    expect(normalizeLoginId("  Aritri ")).toBe("aritri");
    expect(isValidLoginId("aritri")).toBe(true);
    expect(isValidLoginId("ab")).toBe(false);
    expect(isValidLoginId("bad id")).toBe(false);
    expect(isAgentSessionTokenShape("A".repeat(43))).toBe(true);
    expect(isAgentSessionTokenShape("agent:AGT1")).toBe(false);
  });
});
