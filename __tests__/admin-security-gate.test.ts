import { readFileSync } from "node:fs";
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
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/dashboard",
        adminSessionCookie: "DEMO",
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
        talisprosAdminMarker: "1",
      }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/login",
        adminSessionCookie: undefined,
      }),
    ).toEqual({ action: "next" });
  });

  it("still admits Ralf (RM22) and Arun (ARUN) after a real FAST login", () => {
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/dashboard",
        adminSessionCookie: "rm22",
      }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/platform-content",
        adminSessionCookie: "RM22",
      }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/users",
        adminSessionCookie: "ARUN",
      }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/payments",
        adminSessionCookie: "rm22",
      }),
    ).toEqual({ action: "redirect", to: "/admin/dashboard" });
  });

  it("closes the previous public /admin/talismaps hole", () => {
    expect(
      resolveAdminRequestGate({ pathname: "/admin/talismaps" }),
    ).toEqual({ action: "redirect", to: "/admin/login" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/talismaps",
        talisprosAdminMarker: "1",
      }),
    ).toEqual({ action: "next" });
    expect(
      resolveAdminRequestGate({
        pathname: "/admin/talismaps",
        adminSessionCookie: "ARUN",
      }),
    ).toEqual({ action: "next" });
    const middleware = readSource("middleware.ts");
    expect(middleware).toContain("resolveAdminRequestGate");
    expect(middleware).not.toContain('path.startsWith("/admin/talismaps")');
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

  it("exposes Talishouse site only as an admin-only external link (not Home/Catalogue)", () => {
    const layout = readSource("components/admin/AdminLayoutClient.tsx");
    expect(layout).toContain('href="/"');
    expect(layout).toContain("Talispros™ home");
    expect(layout).toContain('href="/catalog"');
    expect(layout).toContain("Talishouse™ site");
    expect(layout).not.toContain('href="/talishouse"');
    expect(layout).toContain('target="_blank"');
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
