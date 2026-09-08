import { describe, expect, it } from "vitest";
import {
  normalizePersonMask,
  personBoundingBox,
  zoomedCropRect,
} from "../lib/media/agent-photo-cutout";
import { isAllowedAgentPhotoUrl } from "../lib/mapsite/agent-photo-url";

describe("normalizePersonMask", () => {
  it("inverts a mostly filled mask", () => {
    const mask = new Uint8Array(10).fill(255);
    mask[0] = 0;
    mask[1] = 0;
    const normalized = normalizePersonMask(mask);
    expect(normalized[0]).toBe(255);
    expect(normalized[2]).toBe(0);
  });
});

describe("personBoundingBox", () => {
  it("returns the opaque region of a binary mask", () => {
    const width = 12;
    const height = 10;
    const mask = new Uint8Array(width * height);
    for (let y = 2; y <= 7; y += 1) {
      for (let x = 3; x <= 8; x += 1) {
        mask[y * width + x] = 255;
      }
    }

    expect(personBoundingBox(mask, width, height)).toEqual({
      x: 3,
      y: 2,
      width: 6,
      height: 6,
    });
  });

  it("returns null when the subject is too small", () => {
    const mask = new Uint8Array(20 * 20);
    mask[0] = 255;
    expect(personBoundingBox(mask, 20, 20)).toBeNull();
  });
});

describe("zoomedCropRect", () => {
  it("tightens the crop around the upper body and stays in bounds", () => {
    const crop = zoomedCropRect(
      { x: 20, y: 20, width: 40, height: 60 },
      100,
      120,
      { padding: 0.1, zoom: 1.3 },
    );

    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.x + crop.width).toBeLessThanOrEqual(100);
    expect(crop.y + crop.height).toBeLessThanOrEqual(120);
    expect(crop.width).toBeLessThan(40 + 20);
    expect(crop.height).toBeLessThan(60 + 30);
  });
});

describe("isAllowedAgentPhotoUrl", () => {
  it("allows public Supabase object URLs only", () => {
    expect(
      isAllowedAgentPhotoUrl(
        "https://vmdcptktlzauhowplyny.supabase.co/storage/v1/object/public/talisbooks-assets/photo.jpg",
      ),
    ).toBe(true);
    expect(isAllowedAgentPhotoUrl("https://evil.example/photo.jpg")).toBe(false);
    expect(isAllowedAgentPhotoUrl("http://vmdcptktlzauhowplyny.supabase.co/x")).toBe(
      false,
    );
  });
});
