import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Markets page gate (admins, superadmins and signed-in agents only)", () => {
  it("asks for the existing Global Admin password instead of sending visitors Home", () => {
    const page = read("app/talisu/mkts/page.tsx");
    const gate = read("components/talisu/MarketsMapOrGate.tsx");
    const action = read("app/talisu/mkts/actions.ts");
    expect(page).toContain("<MarketsMapOrGate");
    expect(gate).toContain("await getAdminSessionAccount()");
    expect(gate).toContain("<MarketsAdminGate");
    expect(gate).not.toContain('redirect("/")');
    expect(action).toContain("acceptGlobalAdminPassword");
    expect(page).toContain("index: false");
  });

  it("resolves Agent Admin sessions (agent_session cookie, site-wide path) as well as admin sessions", () => {
    const auth = read("lib/admin-auth.ts");
    expect(auth).toContain("cookieStore.get(AGENT_SESSION_COOKIE)");
    expect(auth).toContain("getAgentBySessionToken(token)");
    expect(auth).toMatch(/path: "\/"/);
  });

  it("only tells the header a boolean, uncached", () => {
    const route = read("app/api/talisu/admin-status/route.ts");
    expect(route).toContain("Boolean(await getAdminSessionAccount())");
    expect(route).toContain("private, no-store");
  });
});
