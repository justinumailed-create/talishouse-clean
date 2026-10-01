import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TALISU_KB_BUCKET_LABELS,
  TALISU_KB_DEFAULT_AUDIOS,
  TALISU_KB_DEFAULT_LEARNING,
  TALISU_KB_DEFAULT_VIDEOS,
  TALISU_KB_MANAGE_PATH,
  TALISU_KB_MAPSITE_MANAGER_FAST_CODE,
  defaultTalisUKbContent,
  isTalisUKbMapsiteManagerFastCode,
  parseTalisUKbContent,
} from "../lib/talisu/kb-content";

const root = process.cwd();

describe("TalisU Knowledge Base dashboard", () => {
  it("ships default Audios, Videos, and Learning Material buckets", () => {
    expect(TALISU_KB_BUCKET_LABELS).toEqual({
      audios: "Audios",
      videos: "Videos",
      learning: "Learning Material",
    });
    expect(TALISU_KB_DEFAULT_AUDIOS.some((i) => i.href === "/talisu/au")).toBe(
      true,
    );
    expect(TALISU_KB_DEFAULT_VIDEOS.some((i) => i.href === "/talisu/video")).toBe(
      true,
    );
    expect(TALISU_KB_DEFAULT_LEARNING.length).toBeGreaterThan(0);
    const parsed = parseTalisUKbContent(defaultTalisUKbContent());
    expect(parsed.audios[0].title).toContain("Fractionalization");
  });

  it("scopes the Mapsite™ manager entry to rm22", () => {
    expect(TALISU_KB_MAPSITE_MANAGER_FAST_CODE).toBe("rm22");
    expect(isTalisUKbMapsiteManagerFastCode("rm22")).toBe(true);
    expect(isTalisUKbMapsiteManagerFastCode("RM22")).toBe(true);
    expect(isTalisUKbMapsiteManagerFastCode("demo-abc")).toBe(false);
    expect(TALISU_KB_MANAGE_PATH).toBe("/talisu/kb/manage");
  });

  it("renders a tabbed dashboard after the password gate", () => {
    const page = readFileSync(join(root, "app/talisu/kb/page.tsx"), "utf8");
    const dash = readFileSync(
      join(root, "components/talisu/TalisUKbDashboard.tsx"),
      "utf8",
    );
    const manage = readFileSync(
      join(root, "app/talisu/kb/manage/page.tsx"),
      "utf8",
    );
    expect(page).toContain("TalisUKbPasswordGate");
    expect(page).toContain("TalisUKbDashboard");
    expect(dash).toContain("Audios");
    expect(dash).toContain("Videos");
    expect(dash).toContain("Learning Material");
    expect(dash).toContain('role="tablist"');
    expect(manage).toContain("TalisUKbManagePanel");
    expect(manage).toContain("TalisUKbPasswordGate");
  });
});
