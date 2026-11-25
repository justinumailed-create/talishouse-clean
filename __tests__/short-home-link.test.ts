import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isShortHomeFastCode } from "@/lib/talispros/fast-code-shape";

describe("Short client home links", () => {
  it("accepts issued FAST Codes and rejects reserved routes", () => {
    expect(isShortHomeFastCode("dc06")).toBe(true);
    expect(isShortHomeFastCode("DC06")).toBe(true);
    expect(isShortHomeFastCode("rm22")).toBe(true);
    expect(isShortHomeFastCode("jmd03")).toBe(true);
    expect(isShortHomeFastCode("lrg1")).toBe(true);
    expect(isShortHomeFastCode("app")).toBe(false);
    expect(isShortHomeFastCode("home")).toBe(false);
    expect(isShortHomeFastCode("map")).toBe(false);
    expect(isShortHomeFastCode("admin")).toBe(false);
    expect(isShortHomeFastCode("allpins")).toBe(false);
    expect(isShortHomeFastCode("dc06/extra")).toBe(false);
  });

  it("rewrites a matching one-segment path to /home/{code}", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(config).toContain('source: "/:fastCode([a-zA-Z]{2,3}[0-9]{2})"');
    expect(config).toContain('destination: "/home/:fastCode"');
    const middleware = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
    expect(middleware).toContain("isShortHomeFastCode");
    expect(middleware).toContain("`/home/${shortCode[0].toLowerCase()}`");
    expect(middleware).toContain("NextResponse.rewrite");
  });
});
