import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { de } from "@/lib/i18n/dictionaries/de";
import { PMC_MEDIA_DIRECTORY, pmcMediaRows } from "@/lib/talisu/pmc-media-directory";

const clientSrc = readFileSync(
  path.resolve(__dirname, "../components/talisu/pmc/MediaDirectoryClient.tsx"),
  "utf8",
);

describe("PMC Media Directory", () => {
  it("public rows carry no outlet URLs and keep every outlet, including null-url ones", () => {
    const rows = pmcMediaRows();
    expect(rows).toHaveLength(PMC_MEDIA_DIRECTORY.length);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(["flag", "location", "outlet"]);
      expect(JSON.stringify(row)).not.toMatch(/https?:\/\/|www\./);
    }
    expect(rows.find((r) => r.outlet === "Edenway")?.flag).toBe("🌐");
  });

  it("labels every row 'Syndicated <location>' in EN and 'Syndiziert <location>' in DE", () => {
    const label = (tpl: string, loc: string) => tpl.replace("{location}", loc);
    expect(label(en.pmc.media.syndicated, "Singapore")).toBe("Syndicated Singapore");
    expect(label(en.pmc.media.syndicated, "Global")).toBe("Syndicated Global");
    expect(label(de.pmc.media.syndicated, "Vietnam")).toBe("Syndiziert Vietnam");
  });

  it("panel copy is final customer copy in both languages", () => {
    expect(en.pmc.media.panelTitle).toBe("Exposure syndication");
    expect(en.pmc.media.panelBody).toContain("10-day cycle: 7 days on, 3 days off");
    expect(de.pmc.media.panelBody).toContain("10-Tage-Zyklus");
    for (const d of [en.pmc.media, de.pmc.media]) {
      expect(JSON.stringify(d)).not.toMatch(/TODO|TBD|Ralf|placeholder|lorem/i);
    }
  });

  it("intro is localised: EN unchanged from the pitch copy, DE fully translated", async () => {
    const { PMC_MEDIA_DIRECTORY_INTRO, PMC_SYNDICATION_NOTE } = await import("@/lib/talisu/pmc-pitch");
    expect(en.pmc.media.intro).toEqual(PMC_MEDIA_DIRECTORY_INTRO);
    expect(en.pmc.media.syndicationNote).toBe(PMC_SYNDICATION_NOTE);
    expect(de.pmc.media.intro).toHaveLength(en.pmc.media.intro.length);
    for (const line of [...de.pmc.media.intro, de.pmc.media.syndicationNote]) {
      expect(en.pmc.media.intro).not.toContain(line);
      expect(line).not.toMatch(/TODO|TBD|Ralf|Mapsites?™/);
    }
    const pageSrc = readFileSync(path.resolve(__dirname, "../app/talisu/media-directory/page.tsx"), "utf8");
    expect(pageSrc).toContain("t.media.intro");
    expect(pageSrc).not.toContain("PMC_MEDIA_DIRECTORY_INTRO");
  });

  it("client opens one syndication panel, never an outlet iframe or URL", () => {
    expect(clientSrc).not.toMatch(/IframeModal|<iframe|\.url\b|href=/);
    expect(clientSrc).toContain("pmc-syndication-panel");
  });
});
