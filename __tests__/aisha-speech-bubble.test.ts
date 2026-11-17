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

  it("widens past the call pill and stays on the screen", () => {
    const frame = aishaBubbleFrame({
      pillLeft: 24,
      pillTop: 820,
      pillWidth: 220,
      avatarCenter: 52,
      viewportHeight: 900,
      viewportWidth: 1440,
    });
    expect(frame.width).toBe(448);
    expect(frame.left).toBe(24);
    expect(frame.tip).toBeGreaterThan(10);
    expect(frame.tip).toBeLessThan(80);

    const phone = aishaBubbleFrame({
      pillLeft: 32,
      pillTop: 700,
      pillWidth: 220,
      avatarCenter: 56,
      viewportHeight: 844,
      viewportWidth: 390,
    });
    expect(phone.width).toBe(374);
    expect(phone.left).toBeGreaterThanOrEqual(8);
    expect(phone.left + phone.width).toBeLessThanOrEqual(382);
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
