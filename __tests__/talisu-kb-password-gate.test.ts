import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildTalisUKbUnlockHref,
  isTalisUKbPassword,
  TALISU_KB_NEXT_QUERY,
  TALISU_KB_PASSWORD,
  TALISU_KB_UNLOCK_QUERY,
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

  it("builds a navbar unlock href for direct KB hits", () => {
    const href = buildTalisUKbUnlockHref("/talisu/kb/manage");
    expect(href).toContain("/talisu?");
    expect(href).toContain(`${TALISU_KB_UNLOCK_QUERY}=1`);
    expect(href).toContain(
      `${TALISU_KB_NEXT_QUERY}=${encodeURIComponent("/talisu/kb/manage")}`,
    );
  });

  it("protects /talisu/kb via gate redirect (not a full-page password form)", () => {
    const page = readFileSync(join(root, "app/talisu/kb/page.tsx"), "utf8");
    const gate = readFileSync(
      join(root, "components/talisu/TalisUKbPasswordGate.tsx"),
      "utf8",
    );
    const form = readFileSync(
      join(root, "components/talisu/TalisUKbUnlockForm.tsx"),
      "utf8",
    );
    expect(page).toContain("TalisUKbPasswordGate");
    expect(page).not.toContain("Password protection coming soon");
    expect(gate).toContain("buildTalisUKbUnlockHref");
    expect(gate).toContain("router.replace");
    expect(gate).not.toContain("Incorrect password");
    expect(form).toContain("Incorrect password");
    expect(form).toContain("Unlock");
    expect(form).toContain("writeTalisUKbUnlocked");
  });

  it("unlocks into the tabbed Knowledge Base dashboard", () => {
    const page = readFileSync(join(root, "app/talisu/kb/page.tsx"), "utf8");
    expect(page).toContain("TalisUKbDashboard");
    expect(page).not.toContain("Articles and playbooks will land here");
  });
});
