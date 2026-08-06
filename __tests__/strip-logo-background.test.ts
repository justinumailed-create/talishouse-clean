import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  isLogoUploadField,
  stripLogoBackground,
} from "../lib/media/strip-logo-background";

async function makeLogoWithWhiteBackground(): Promise<Buffer> {
  const size = 120;
  const raw = Buffer.alloc(size * size * 4, 255);
  for (let y = 30; y < 90; y += 1) {
    for (let x = 30; x < 90; x += 1) {
      const i = (y * size + x) * 4;
      raw[i] = 20;
      raw[i + 1] = 20;
      raw[i + 2] = 20;
      raw[i + 3] = 255;
    }
  }
  return sharp(raw, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toBuffer();
}

describe("stripLogoBackground", () => {
  it("makes white backdrop pixels transparent", async () => {
    const source = await makeLogoWithWhiteBackground();
    const stripped = await stripLogoBackground(source);
    expect(stripped.mimeType).toBe("image/png");

    const { data, info } = await sharp(stripped.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const corner = 0;
    expect(data[corner + 3]).toBe(0);

    const center = ((Math.floor(info.height / 2) * info.width +
      Math.floor(info.width / 2)) *
      info.channels) as number;
    expect(data[center + 3]).toBeGreaterThan(200);
  });

  it("recognizes logo upload field names", () => {
    expect(isLogoUploadField("logo")).toBe(true);
    expect(isLogoUploadField("brokerageLogo")).toBe(true);
    expect(isLogoUploadField("brokerage-logo")).toBe(true);
    expect(isLogoUploadField("picture")).toBe(false);
  });
});
