import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isAdminAppPath,
  isProtectedAdminPath,
  isPublicAdminPath,
  isStandaloneAdminPath,
  shouldHidePublicStorefrontChrome,
} from "../lib/admin-paths";
import { resolveAdminRequestGate } from "../lib/admin-request-gate";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("admin path helpers", () => {
  it("treats only /admin/login as public Global Admin", () => {
    expect(isPublicAdminPath("/admin/login")).toBe(true);
    expect(isPublicAdminPath("/admin/login/")).toBe(true);
    expect(isProtectedAdminPath("/admin/dashboard")).toBe(true);
    expect(isProtectedAdminPath("/admin/mapsites/rm22")).toBe(true);
    expect(isProtectedAdminPath("/admin/talismaps")).toBe(true);
    expect(isProtectedAdminPath("/admin/login")).toBe(false);
    expect(isAdminAppPath("/talishouse")).toBe(false);
    expect(isStandaloneAdminPath("/admin/talismaps")).toBe(true);
  });

  it("hides Talishouse storefront chrome on every /admin route", () => {
    expect(shouldHidePublicStorefrontChrome("/admin")).toBe(true);
    expect(shouldHidePublicStorefrontChrome("/admin/login")).toBe(true);
    expect(shouldHidePublicStorefrontChrome("/admin/dashboard")).toBe(true);
    expect(shouldHidePublicStorefrontChrome("/catalogue")).toBe(false);
    expect(shouldHidePublicStorefrontChrome("/talishouse")).toBe(false);
  });
});

describe("admin request gate", () => {
  it("sends anonymous visitors to login and never opens protected admin", () => {
    expect(
      resolveAdminRequestGate({ pathname: "/admin/dashboard" }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    // Retired / malformed codes are refused at the edge; other FAST Codes go to
    // the /admin layout, which checks admin_access_grants server-side.
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/dashboard",
        adminSessionCookie: "ADMIN123",
      }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/dashboard",
        adminSessionCookie: "bad code!",
      }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/mapsites",
        adminSessionCookie: "",
      }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
  });

  it("does not treat marketing or mapsite cookies as Global Admin", () => {
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/dashboard",
      }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/login",
        adminSessionCookie: undefined,
      }),
    ).toEqual({ action: "next" });
  });

  it("refuses a FAST Code in the admin cookie; only an opaque session token passes the edge", () => {
    const token = "A".repeat(43);
    for (const code of ["rm22", "RM22", "ARUN", "arun"]) {
      expect(
        resolveAdminRequestGate({ pathname: "/admin/dashboard", adminSessionCookie: code }),
      ).toEqual({ action: "redirect", to: "/admin/login" });
    }
    // Token-shaped values go on to the /admin layout, which validates the hash
    // against admin_sessions (forged tokens are rejected there).
    expect(
      resolveAdminRequestGate({ pathname: "/admin/users", adminSessionCookie: token }),
    ).toEqual({ action: "next" });
    // Grant permissions (e.g. RM22 has no Payments) are enforced in the layout.
    expect(readSource("app/admin/layout.tsx")).toContain("accountCanAccessAdminPath(account, pathname)");
  });

  it("closes the previous public /admin/talismaps hole", () => {
    expect(
      resolveAdminRequestGate({ pathname: "/admin/talismaps" }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({ pathname: "/admin/talismaps", adminSessionCookie: "ARUN" }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({ pathname: "/admin/talismaps", adminSessionCookie: "B".repeat(43) }),
    ).toEqual({ action: "next" });
    // ...and the layout requires a validated session on the standalone route too.
    expect(readSource("app/admin/layout.tsx")).toMatch(/isStandaloneAdminPath\(pathname\)\) \{\n\s+if \(!account\) redirect\("\/admin\/login"\)/);
    const middleware = readSource("middleware.ts");
    expect(middleware).toContain("resolveAdminRequestGate");
    expect(middleware).not.toContain('path.startsWith("/admin/talismaps")');
  });
});

describe("retired Supabase email/password admin (/talispros/admin)", () => {
  it("removes the route tree and the email-login admin auth module", () => {
    expect(existsSync(resolve("app/talispros/admin"))).toBe(false);
    expect(existsSync(resolve("lib/talispros-admin-auth.ts"))).toBe(false);
    expect(readSource("middleware.ts")).not.toContain("talispros_admin_session");
    expect(readSource("lib/admin-request-gate.ts")).not.toContain("talisprosAdminMarker");
  });

  it("redirects old /talispros/admin URLs to the FAST-code admin login", () => {
    const config = readSource("next.config.ts");
    expect(config).toContain('source: "/talispros/admin",');
    expect(config).toContain('source: "/talispros/admin/:path*",');
    expect(config.match(/destination: "\/admin\/login"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("gates the Marketing Manager portal on the FAST-code admin session only", () => {
    const auth = readSource("lib/marketing-manager-auth.ts");
    expect(auth).toContain("getAdminSessionAccount");
    expect(auth).not.toContain("getTalisprosAdminSession");
    expect(auth).not.toContain("process.env.MARKETING_MANAGER_EMAILS");
    expect(readSource("app/talispros/marketing/login/page.tsx")).toContain('redirect("/admin/login")');
  });

  it("serves PMC pins and Forms Manager under /admin", () => {
    expect(readSource("app/admin/pmc/page.tsx")).toContain('requireAdminScopePage("platform-content")');
    expect(readSource("app/admin/pmc/actions.ts")).toContain('requireAdminScope("platform-content")');
    expect(readSource("app/admin/forms-manager/page.tsx")).toContain("FormsManagerPage");
  });
});

describe("admin chrome must not inherit Talishouse storefront", () => {
  it("excludes /admin from RootShell header, footer, cart, and Talisbot", () => {
    const shell = readSource("components/RootShell.tsx");
    expect(shell).toContain("shouldHidePublicStorefrontChrome");
    expect(shell).toContain("hideStorefrontChrome");
  });

  it("hides Header, Footer, and Talisbot on /admin", () => {
    expect(readSource("components/Header.tsx")).toContain("shouldHidePublicStorefrontChrome");
    expect(readSource("components/Footer.tsx")).toContain("shouldHidePublicStorefrontChrome");
    expect(readSource("components/TalisBotChat.tsx")).toContain("shouldHidePublicStorefrontChrome");
  });

  it("has no Talishouse storefront / cart links in admin chrome", () => {
    const layout = readSource("components/admin/AdminLayoutClient.tsx");
    expect(layout).toContain('href="/"');
    expect(layout).toContain("Talispros™ home");
    expect(layout).not.toContain('href="/catalog"');
    expect(layout).not.toContain("Talishouse™ site");
    expect(layout).not.toContain('href="/talishouse"');
    expect(layout).not.toMatch(/cart/i);
    expect(layout).not.toContain("ROUTES.TALISHOUSE");
    expect(layout).not.toContain("/catalogue");
    // Must not use public storefront Home/Catalogue labels in admin chrome
    expect(layout).not.toMatch(/>\s*Home\s*</);
    expect(layout).not.toMatch(/>\s*Catalogue\s*</);
  });

  it("fails closed until the server confirms a FAST-code session", () => {
    const layout = readSource("components/admin/AdminLayoutClient.tsx");
    expect(layout).toContain("serverAccount");
    expect(layout).toContain("isProtectedAdminRoute && !serverAccount");
    expect(layout).not.toMatch(/\bredirect\(/);
    const adminLayout = readSource("app/admin/layout.tsx");
    expect(adminLayout).toContain("getAdminSessionAccount");
    expect(adminLayout).toContain('redirect("/admin/login")');
    expect(adminLayout).toContain('dynamic = "force-dynamic"');
    const loginForm = readSource("components/admin/AdminLoginForm.tsx");
    expect(loginForm).toContain("loginAdminWithFastCodeAction");
    expect(loginForm).not.toContain("isValidAdminFastCode");
  });
});
