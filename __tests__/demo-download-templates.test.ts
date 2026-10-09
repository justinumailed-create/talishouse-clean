import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({
  admin: false,
  ownerSession: null as string | null,
  registeredCode: null as string | null,
  paidCodes: new Set<string>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mapsite-edit-auth", () => ({
  isMapSiteAdmin: vi.fn(async () => auth.admin),
  getMapSiteOwnerSession: vi.fn(async () => auth.ownerSession),
  getRegisteredMapSiteFastCode: vi.fn(async () => auth.registeredCode),
  // Mirrors canEditMapSite: admin, or owner session for this code + completed payment.
  canEditMapSite: vi.fn(async (code: string) => {
    if (auth.admin) return true;
    const owns = auth.ownerSession === code || auth.registeredCode === code;
    return owns && auth.paidCodes.has(code);
  }),
}));

import { GET } from "@/app/api/templates/[format]/route";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";

const GOOGLE_SLIDES_ID = "1UmNQdsJZtonuw16i54PNP16WXEfBP2f3x3TVthcb3kA";

function get(format: string, fastCode?: string) {
  const url = new URL(`http://localhost/api/templates/${format}`);
  if (fastCode) url.searchParams.set("fastCode", fastCode);
  return GET(new NextRequest(url), { params: Promise.resolve({ format }) });
}

beforeEach(() => {
  auth.admin = false;
  auth.ownerSession = null;
  auth.registeredCode = null;
  auth.paidCodes = new Set();
});

describe("gated Replace Image template downloads", () => {
  it("rejects anonymous visitors with 403", async () => {
    for (const format of ["pptx", "key"]) {
      expect((await get(format)).status).toBe(403);
      expect((await get(format, "lrg1")).status).toBe(403);
    }
  });

  it("rejects an owner session whose Mapsite is not paid (draft / unregistered)", async () => {
    auth.ownerSession = "abc12";
    expect((await get("pptx", "abc12")).status).toBe(403);
    expect((await get("key")).status).toBe(403);
  });

  it("rejects demo Mapsite codes even with an owner session", async () => {
    auth.ownerSession = "demo-1a2b3c4d";
    auth.paidCodes.add("demo-1a2b3c4d");
    expect((await get("pptx", "demo-1a2b3c4d")).status).toBe(403);
  });

  it("rejects a paid owner asking for someone else's FAST Code", async () => {
    auth.ownerSession = "lrg1";
    auth.paidCodes.add("lrg1");
    expect((await get("pptx", "rm22")).status).toBe(403);
  });

  it("serves the files to a registered (paid) owner", async () => {
    auth.ownerSession = "lrg1";
    auth.paidCodes.add("lrg1");
    const pptx = await get("pptx", "lrg1");
    expect(pptx.status).toBe(200);
    expect(pptx.headers.get("content-disposition")).toContain("Talispros-Demo-Template.pptx");
    expect(pptx.headers.get("cache-control")).toContain("no-store");
    expect((await pptx.arrayBuffer()).byteLength).toBeGreaterThan(100_000);
    // Without ?fastCode the browser's own owner session is used.
    const key = await get("key");
    expect(key.status).toBe(200);
    expect(key.headers.get("content-disposition")).toContain("Talispros-Demo-Template.key");
  });

  it("serves admins", async () => {
    auth.admin = true;
    expect((await get("pptx")).status).toBe(200);
  });

  it("404s unknown formats", async () => {
    auth.admin = true;
    expect((await get("pdf")).status).toBe(404);
  });
});

describe("templates are not public", () => {
  it("keeps the files out of public/ and bundles them for the gated route", () => {
    expect(existsSync(join(process.cwd(), "public/talisu/templates"))).toBe(false);
    for (const name of ["Talispros-Demo-Template.pptx", "Talispros-Demo-Template.key"]) {
      expect(statSync(join(process.cwd(), "private/templates", name)).size).toBeGreaterThan(100_000);
    }
    const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(nextConfig).toMatch(/outputFileTracingIncludes[\s\S]*"\/api\/templates\/\*\*"[\s\S]*private\/templates/);
  });

  it("demo download menu offers only the Demo PDF plus a Register-to-unlock note", () => {
    const menu = readFileSync(
      join(process.cwd(), "components/talispros/demo-mapsite/DemoDownloadMenu.tsx"),
      "utf8",
    );
    expect(menu).toContain("DEMO_MAPSITE_PDF_HREF");
    expect(menu).toContain("ROUTES.TALISU_REGISTER");
    expect(menu).not.toMatch(/\.pptx|Template\.key|api\/templates|docs\.google|replaceImageTemplateHref/);
    expect(menu).not.toContain('target="_blank"');
    expect(en.demo.downloadMenuRegister).toBe("Register to unlock templates");
    expect(de.demo.downloadMenuRegister).toContain("Vorlagen freizuschalten");
  });

  it("never ships the Google Slides link in client code or dictionaries", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        return entry.isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
      });
    const files = [...walk(join(process.cwd(), "components")), ...walk(join(process.cwd(), "lib"))];
    const offenders = files.filter(
      (file) =>
        readFileSync(file, "utf8").includes(GOOGLE_SLIDES_ID) &&
        !file.endsWith("replace-image-templates.server.ts"),
    );
    expect(offenders).toEqual([]);
    const server = readFileSync(
      join(process.cwd(), "lib/talispros/replace-image-templates.server.ts"),
      "utf8",
    );
    expect(server.startsWith('import "server-only";')).toBe(true);
  });

  it("shows the templates on the gated owner ebook pages", () => {
    for (const page of [
      "app/talispros/mapsites/[fastCode]/ebooks/new/page.tsx",
      "app/talispros/mapsites/[fastCode]/ebooks/[bookId]/page.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), page), "utf8");
      expect(source).toContain("canEditMapSite(fastCode)");
      expect(source).toContain("<OwnerReplaceImageTemplates");
      expect(source).toContain("getReplaceImageGoogleSlidesCopyUrl()");
    }
  });
});
