import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(p), "utf8");

describe("Markets page gate (admins, superadmins and signed-in agents only)", () => {
  it("redirects anyone without an admin or agent session Home", () => {
    const page = read("app/talisu/mkts/page.tsx");
    expect(page).toContain("await getAdminSessionAccount()");
    expect(page).toContain('if (!account) redirect("/")');
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
