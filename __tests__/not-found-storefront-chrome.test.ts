import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STOREFRONT_CHROME_CLASS } from "../lib/storefront-chrome";

function readSource(relativePath: string) {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("404 / not-found hides Talishouse storefront chrome", () => {
  it("exports a shared chrome marker class", () => {
    expect(STOREFRONT_CHROME_CLASS).toBe("th-storefront-chrome");
  });

  it("root not-found mounts HideStorefrontChrome", () => {
    const src = readSource("app/not-found.tsx");
    expect(src).toContain("HideStorefrontChrome");
    expect(src).toContain("NotFoundView");
  });

  it("global-not-found bypasses RootShell (no navbar/cart/Talisbot providers)", () => {
    const src = readSource("app/global-not-found.tsx");
    expect(src).toContain("NotFoundView");
    expect(src).toContain("<html");
    expect(src).not.toMatch(/from ["']@\/components\/RootShell["']/);
    expect(src).not.toContain("CartProvider");
    expect(src).not.toContain("TalisBotChat");
    expect(src).not.toMatch(/from ["']@\/components\/Header["']/);
  });

  it("enables experimental globalNotFound in next.config", () => {
    expect(readSource("next.config.ts")).toContain("globalNotFound: true");
  });

  it("marks Header, Footer, Talisbot, and Cart with the chrome class", () => {
    for (const file of [
      "components/Header.tsx",
      "components/Footer.tsx",
      "components/TalisBotChat.tsx",
      "components/CartDrawer.tsx",
    ]) {
      expect(readSource(file)).toContain("STOREFRONT_CHROME_CLASS");
      expect(readSource(file)).toContain("@/lib/storefront-chrome");
    }
  });

  it("HideStorefrontChrome injects CSS that hides the chrome class", () => {
    const src = readSource("components/HideStorefrontChrome.tsx");
    expect(src).toContain("STOREFRONT_CHROME_CLASS");
    expect(src).toContain("display:none");
  });

  it("keeps /talisu embed path in RootShell", () => {
    const shell = readSource("components/RootShell.tsx");
    expect(shell).toContain('pathname.startsWith("/talisu")');
    expect(shell).toContain("shouldHidePublicStorefrontChrome");
  });
});
