import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isTalisUKbPassword,
  TALISU_KB_PASSWORD,
  TALISU_KB_UNLOCK_STORAGE_KEY,
} from "../lib/talisu/kb-gate";

const root = process.cwd();

describe("TalisU Knowledge Base password gate", () => {
  it("accepts exactly Admin123", () => {
    expect(TALISU_KB_PASSWORD).toBe("Admin123");
    expect(isTalisUKbPassword("Admin123")).toBe(true);
    expect(isTalisUKbPassword("admin123")).toBe(false);
    expect(isTalisUKbPassword("")).toBe(false);
    expect(TALISU_KB_UNLOCK_STORAGE_KEY).toBe("talisu_kb_unlocked_v1");
  });

  it("wraps /talisu/kb with the client password gate", () => {
    const page = readFileSync(join(root, "app/talisu/kb/page.tsx"), "utf8");
    const gate = readFileSync(
      join(root, "components/talisu/TalisUKbPasswordGate.tsx"),
      "utf8",
    );
    expect(page).toContain("TalisUKbPasswordGate");
    expect(page).not.toContain("Password protection coming soon");
    expect(gate).toContain("sessionStorage");
    expect(gate).toContain("TALISU_KB_UNLOCK_STORAGE_KEY");
    expect(gate).toContain("Incorrect password");
    expect(gate).toContain("Unlock");
  });
});
