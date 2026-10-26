import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../lib/i18n/dictionaries/en";
import * as kbGateModule from "../lib/talisu/kb-gate";
import {
  TALISU_KB_LOCKED_EVENT,
  TALISU_KB_OPEN_UNLOCK_EVENT,
  TALISU_KB_UNLOCKED_EVENT,
  TALISU_KB_UNLOCK_STORAGE_KEY,
} from "../lib/talisu/kb-gate";

const root = process.cwd();

describe("TalisU Knowledge Base password gate", () => {
  it("has no shared KB password anywhere (FAST Code only, checked on the server)", () => {
    expect(Object.keys(kbGateModule)).not.toContain("TALISU_KB_PASSWORD");
    expect(Object.keys(kbGateModule)).not.toContain("isTalisUKbPassword");
    expect(TALISU_KB_UNLOCK_STORAGE_KEY).toBe("talisu_kb_unlocked_v1");
    const kbGate = readFileSync(join(root, "lib/talisu/kb-gate.ts"), "utf8");
    const actions = readFileSync(join(root, "app/talisu/kb/access-actions.ts"), "utf8");
    const form = readFileSync(join(root, "components/talisu/TalisUKbUnlockForm.tsx"), "utf8");
    expect(kbGate).not.toMatch(/PASSWORD\s*=/);
    expect(actions).toContain('"use server"');
    expect(actions).not.toContain("kb-gate");
    expect(actions).toContain("resolveFastCodeAdminAccount");
    expect(form).toContain("unlockTalisUKbAction");
    expect(en.kbUnlock.placeholder).toBe("FAST Code");
    expect(en.kbUnlock.passwordLabel).toBe("FAST Code");
    expect(en.kbUnlock.error).not.toMatch(/password/i);
  });

  it("opens unlock in-navbar / inline without redirecting to /talisu?kbUnlock=", () => {
    const gate = readFileSync(
      join(root, "components/talisu/TalisUKbPasswordGate.tsx"),
      "utf8",
    );
    const header = readFileSync(
      join(root, "components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    const kbGate = readFileSync(join(root, "lib/talisu/kb-gate.ts"), "utf8");

    expect(gate).toContain("requestTalisUKbNavbarUnlock");
    expect(gate).toContain("TalisUKbUnlockForm");
    expect(gate).not.toContain("router.replace");
    expect(gate).not.toContain("buildTalisUKbUnlockHref");
    expect(gate).not.toContain("router.push");
    expect(gate).not.toMatch(/href=\{\`?\/talisu\?/);
    expect(header).not.toContain("kbUnlock=1");

    expect(header).toContain("TALISU_KB_OPEN_UNLOCK_EVENT");
    expect(header).not.toContain("TALISU_KB_UNLOCK_QUERY");
    expect(header).not.toContain("kbUnlock=1");

    expect(kbGate).toContain(TALISU_KB_OPEN_UNLOCK_EVENT);
    expect(kbGate).toContain(TALISU_KB_UNLOCKED_EVENT);
    expect(kbGate).toContain(TALISU_KB_LOCKED_EVENT);
    expect(kbGate).toContain("clearTalisUKbUnlocked");
    expect(kbGate).not.toContain("buildTalisUKbUnlockHref");
  });

  it("protects /talisu/kb via gate (not a full-page bounce)", () => {
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
    expect(gate).toContain("TalisUKbUnlockForm");
    expect(gate).not.toContain("Incorrect password");
    expect(form).toContain("k.error");
    expect(en.kbUnlock.error).toContain("FAST Code");
    expect(form).toContain("Unlock");
    expect(form).toContain("writeTalisUKbUnlocked");
  });

  it("styles the unlock form as a light PayPal-like password card", () => {
    const form = readFileSync(
      join(root, "components/talisu/TalisUKbUnlockForm.tsx"),
      "utf8",
    );
    const header = readFileSync(
      join(root, "components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );
    expect(form).toContain("bg-white");
    expect(form).toContain("type=\"password\"");
    expect(form).toContain("#0070ba");
    expect(form).not.toContain("bg-white/10");
    expect(form).not.toContain("text-white/90");
    expect(header).toContain("bg-white p-5");
    expect(header).toContain("rounded-2xl");
    expect(header).toContain("max-w-none!");
    expect(header).toContain("min-w-[280px]");
  });

  it("unlocks into the tabbed Knowledge Base dashboard", () => {
    const page = readFileSync(join(root, "app/talisu/kb/page.tsx"), "utf8");
    expect(page).toContain("TalisUKbDashboard");
    expect(page).not.toContain("Articles and playbooks will land here");
  });

  it("offers Logout that clears session without a full-page redirect", () => {
    const logout = readFileSync(
      join(root, "components/talisu/TalisUKbLogoutButton.tsx"),
      "utf8",
    );
    const gate = readFileSync(
      join(root, "components/talisu/TalisUKbPasswordGate.tsx"),
      "utf8",
    );
    const dash = readFileSync(
      join(root, "components/talisu/TalisUKbDashboard.tsx"),
      "utf8",
    );
    const manage = readFileSync(
      join(root, "components/talisu/TalisUKbManagePanel.tsx"),
      "utf8",
    );
    const header = readFileSync(
      join(root, "components/talisu/TalisUMktsHeader.tsx"),
      "utf8",
    );

    expect(logout).toContain("Logout");
    expect(logout).toContain("clearTalisUKbUnlocked");
    expect(logout).toContain("notifyTalisUKbLocked");
    expect(logout).toContain("requestTalisUKbNavbarUnlock");
    expect(logout).not.toContain("window.location");
    expect(logout).not.toContain("router.push");
    expect(logout).not.toContain("router.replace");

    expect(gate).toContain("TALISU_KB_LOCKED_EVENT");
    expect(header).toContain("TALISU_KB_LOCKED_EVENT");
    expect(dash).toContain("TalisUKbLogoutButton");
    expect(manage).toContain("TalisUKbLogoutButton");
  });
});
