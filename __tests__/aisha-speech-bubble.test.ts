import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  aishaSpeechBubblePath,
  aishaSpeechBubbleTipX,
} from "@/lib/talispros/aisha-speech-bubble";

describe("Aisha speech bubble outline", () => {
  it("puts one continuous tail on the bottom, toward the call bar", () => {
    const right = aishaSpeechBubblePath(296, 110, "right");
    const left = aishaSpeechBubblePath(296, 110, "left");
    expect(right.endsWith("Z")).toBe(true);
    expect(right).toContain("C ");
    expect(aishaSpeechBubbleTipX(296, "right")).toBeGreaterThan(
      aishaSpeechBubbleTipX(296, "left"),
    );
    expect(right).not.toBe(left);
    expect(right).toContain("109");
  });

  it("does not use a detached rotated square for the tail", () => {
    const widget = readFileSync(
      resolve("components/talispros/AishaConvaiWidget.tsx"),
      "utf8",
    );
    const css = readFileSync(resolve("app/globals.css"), "utf8");
    expect(widget).toContain("aishaSpeechBubblePath");
    expect(widget).not.toContain("rotate(45deg)");
    expect(css).not.toContain(".aisha-convai-label::after");
  });
});
