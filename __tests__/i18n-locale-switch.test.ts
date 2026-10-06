import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  normalizeLocale,
  readLocaleQuery,
} from "../lib/i18n/config";
import { buildLocaleCookie, persistLocale, stripLocaleQuery } from "../lib/i18n/cookie";
import { localeAlternates, localizedUrl } from "../lib/i18n/metadata";
import { createTalisUMetadata } from "../lib/talisu/seo";
import { createMetadata } from "../lib/seo";
import { config as middlewareConfig, middleware } from "../middleware";
import { NextRequest } from "next/server";

describe("EN | DE switch", () => {
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale("DE")).toBe("de");
    expect(normalizeLocale("de-DE")).toBe("de");
  });

  it("persists the choice in a 1-year cookie and sets <html lang>", () => {
    const doc = {
      cookie: "",
      documentElement: { lang: "en" },
      location: { protocol: "https:" },
    };
    persistLocale("de", doc);
    expect(doc.cookie).toBe(
      `${LOCALE_COOKIE}=de; path=/; max-age=31536000; samesite=lax; secure`,
    );
    expect(doc.documentElement.lang).toBe("de");

    persistLocale("en", { ...doc, location: { protocol: "http:" } });
    expect(buildLocaleCookie("en")).toBe(
      `${LOCALE_COOKIE}=en; path=/; max-age=31536000; samesite=lax`,
    );
  });

  it("drops a ?lang= override after switching (keeps other params + hash)", () => {
    expect(stripLocaleQuery("https://x.test/talisu?lang=de#faq")).toBe("/talisu#faq");
    expect(stripLocaleQuery("https://x.test/talisu/engage?product=P07&lang=en")).toBe(
      "/talisu/engage?product=P07",
    );
    expect(stripLocaleQuery("https://x.test/talisu")).toBeNull();
  });

  it("renders the switch in the blue navbar after TalisU", () => {
    const header = readFileSync(resolve("components/talisu/TalisUMktsHeader.tsx"), "utf8");
    const talisU = header.indexOf("{t.nav.talisu}");
    const sw = header.indexOf("<LanguageSwitch");
    expect(talisU).toBeGreaterThan(-1);
    expect(sw).toBeGreaterThan(talisU);
    const switchSrc = readFileSync(resolve("components/i18n/LanguageSwitch.tsx"), "utf8");
    expect(switchSrc).toContain("persistLocale(next, document)");
    expect(switchSrc).toContain("router.refresh()");
    expect(switchSrc).toContain("aria-pressed");
  });

  it("sets <html lang> from the server locale in the root layout", () => {
    const layout = readFileSync(resolve("app/layout.tsx"), "utf8");
    expect(layout).toContain("<html lang={LOCALE_HTML_LANG[locale]}>");
    expect(layout).toContain("<LocaleProvider locale={locale}>");
  });
});

describe("?lang= alternates", () => {
  it("reads only supported values", () => {
    expect(readLocaleQuery(new URLSearchParams("lang=de"))).toBe("de");
    expect(readLocaleQuery(new URLSearchParams("lang=xx"))).toBeNull();
    expect(readLocaleQuery(new URLSearchParams(""))).toBeNull();
  });

  it("builds canonical + hreflang (en, de, x-default)", () => {
    expect(localizedUrl("https://www.talispros.com/talisu", "de")).toBe(
      "https://www.talispros.com/talisu?lang=de",
    );
    expect(localeAlternates("https://www.talispros.com/talisu", "de")).toEqual({
      canonical: "https://www.talispros.com/talisu?lang=de",
      languages: {
        en: "https://www.talispros.com/talisu",
        de: "https://www.talispros.com/talisu?lang=de",
        "x-default": "https://www.talispros.com/talisu",
      },
    });
    const meta = createTalisUMetadata({ title: "t", description: "d", path: "/talisu", locale: "de" });
    expect(meta.alternates?.canonical).toBe("https://www.talispros.com/talisu?lang=de");
    expect((meta.openGraph as { locale?: string }).locale).toBe("de_DE");
    // Untranslated pages keep their plain English canonical.
    const plain = createMetadata({ title: "t", description: "d", path: "/x" });
    expect(plain.alternates).toEqual({ canonical: "https://www.talishouse.com/x" });
  });

  it("middleware forwards ?lang= as a header and persists the cookie", () => {
    const res = middleware(new NextRequest("https://www.talispros.com/talisu?lang=de"));
    expect(res.headers.get(`x-middleware-request-${LOCALE_HEADER}`)).toBe("de");
    expect(res.cookies.get(LOCALE_COOKIE)?.value).toBe("de");
    const matcher = JSON.stringify(middlewareConfig.matcher);
    expect(matcher).toContain('"key":"lang"');
    expect(matcher).toContain("/business-office/:path*");
  });

  it("middleware still guards /business-office without auth", () => {
    const res = middleware(new NextRequest("https://www.talispros.com/business-office"));
    expect(res.status).toBe(307);
    const open = middleware(new NextRequest("https://www.talispros.com/business-office/apply"));
    expect(open.status).toBe(200);
  });
});
