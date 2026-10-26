import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ACTIVITY_COOKIE,
  ADMIN_ACTIVITY_EVENTS,
  ADMIN_ACTIVITY_MAX_AGE,
  ADMIN_IDLE_HEARTBEAT_MS,
  ADMIN_IDLE_LOGIN_PATH,
  ADMIN_IDLE_TIMEOUT_MS,
  isAdminIdle,
  isIdleLogoutAccess,
} from "../lib/admin-idle";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("admin 1-minute idle logout", () => {
  it("times out after 60 s and covers only Global + granted admins", () => {
    expect(ADMIN_IDLE_TIMEOUT_MS).toBe(60_000);
    expect(isAdminIdle(0, 59_999)).toBe(false);
    expect(isAdminIdle(0, 60_000)).toBe(true);
    expect(isIdleLogoutAccess("global")).toBe(true);
    expect(isIdleLogoutAccess("granted")).toBe(true);
    expect(isIdleLogoutAccess("agent")).toBe(false);
    expect(isIdleLogoutAccess(undefined)).toBe(false);
    expect([...ADMIN_ACTIVITY_EVENTS]).toEqual(
      expect.arrayContaining(["mousemove", "keydown", "touchstart", "scroll"]),
    );
    expect(ADMIN_IDLE_LOGIN_PATH).toBe("/admin/login?idle=1");
  });

  it("server cap outlives the client timeout + heartbeat gap", () => {
    expect(ADMIN_ACTIVITY_MAX_AGE * 1000).toBeGreaterThanOrEqual(
      ADMIN_IDLE_TIMEOUT_MS + ADMIN_IDLE_HEARTBEAT_MS,
    );
    const auth = read("lib/admin-auth.ts");
    expect(auth).toContain("cookieStore.set(ADMIN_ACTIVITY_COOKIE");
    expect(auth).toContain("cookieStore.delete(ADMIN_ACTIVITY_COOKIE)");
    const mw = read("middleware.ts");
    expect(mw).toContain("ADMIN_ACTIVITY_COOKIE");
    expect(mw).toContain("ADMIN_IDLE_LOGIN_PATH");
    expect(mw).toContain("res.cookies.set(ADMIN_SESSION_COOKIE");
    expect(ADMIN_ACTIVITY_COOKIE).toBe("admin_active");
  });

  it("client timer calls the real logout action, shares activity across tabs, and is mounted for admins only", () => {
    const idle = read("components/admin/AdminIdleLogout.tsx");
    expect(idle).toContain("await logoutAdminAction()");
    expect(idle).toContain("touchAdminActivityAction()");
    expect(idle).toContain("ADMIN_LAST_ACTIVE_STORAGE_KEY");
    expect(idle).toContain('"storage"');
    expect(idle).toContain("window.location.replace(ADMIN_IDLE_LOGIN_PATH)");
    const layout = read("components/admin/AdminLayoutClient.tsx");
    expect(layout).toContain("isIdleLogoutAccess(serverAccount?.access)");
    expect(layout).toContain("<AdminIdleLogout");
    const actions = read("app/admin/actions.ts");
    expect(actions).toContain("export async function touchAdminActivityAction");
  });

  it("shows the EN / DE notice on the admin login", () => {
    expect(en.adminIdle.signedOut).toBe("Signed out after 1 minute of inactivity.");
    expect(de.adminIdle.signedOut).toBe("Nach 1 Minute Inaktivität abgemeldet.");
    expect(read("app/admin/login/page.tsx")).toContain("t.adminIdle.signedOut");
    expect(read("components/admin/AdminLoginForm.tsx")).toContain('data-testid="admin-idle-notice"');
  });
});

describe("TalisU KB copy", () => {
  it("no longer promises signed-in accounts direct access", () => {
    expect(en.kbUnlock.prompt).toBe("Enter your FAST Code to unlock.");
    expect(de.kbUnlock.prompt).toBe("Geben Sie Ihren FAST Code ein, um die Inhalte freizuschalten.");
    expect(en.kbUnlock.prompt).not.toMatch(/Signed-in/);
    expect(de.kbUnlock.prompt).not.toMatch(/Angemeldete/);
  });
});
