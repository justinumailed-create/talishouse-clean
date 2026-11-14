import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  aishaBubbleFrame,
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
    const aimed = aishaSpeechBubbleTipX(168, "right", 36);
    expect(aimed).toBeLessThan(80);
    expect(aishaSpeechBubblePath(168, 110, "right", 36)).toContain(String(aimed));
  });

  it("matches the call pill's left and right edges", () => {
    const frame = aishaBubbleFrame({
      pillLeft: 835,
      pillTop: 820,
      pillWidth: 168,
      avatarCenter: 853,
      viewportHeight: 900,
    });
    expect(frame.left).toBe(835);
    expect(frame.left + frame.width).toBe(1003);
    expect(frame.tip).toBeGreaterThan(10);
    expect(frame.tip).toBeLessThan(40);
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
