import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TalisU Audio / Video TalisTV soon placeholders", () => {
  it("renders the shared placeholder on /talisu/au and /talisu/video", () => {
    const audio = readFileSync(resolve("app/talisu/au/page.tsx"), "utf8");
    const video = readFileSync(resolve("app/talisu/video/page.tsx"), "utf8");
    const placeholder = readFileSync(
      resolve("components/talisu/TalisUTalisTvSoonPlaceholder.tsx"),
      "utf8",
    );

    expect(audio).toContain("TalisUTalisTvSoonPlaceholder");
    expect(video).toContain("TalisUTalisTvSoonPlaceholder");
    expect(placeholder).toContain("All Contents will be posted on TalisTV soon!");
    expect(placeholder).toContain("#046BD9");
  });
});
