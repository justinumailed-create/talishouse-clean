import { describe, expect, it } from "vitest";
import {
  EBOOK_UPLOAD_ACCEPT,
  EBOOK_UPLOAD_UNSUPPORTED_MESSAGE,
  isAllowedEbookImageFormatName,
  isAllowedEbookImageUpload,
  isAllowedEbookPdfUpload,
  isAllowedEbookUpload,
  isProhibitedEbookImageUpload,
} from "../lib/talisbooks/ebook-upload-formats";
import { classifyUploadFile } from "../lib/talisbooks/pdf-pages-to-images";
import { assertAllowedEbookImageBuffer } from "../lib/talisbooks/ebook-upload-formats-server";
import sharp from "sharp";

function named(name: string, type: string) {
  return { name, type };
}

describe("ebook upload formats", () => {
  it("accepts PDF, JPG, JPEG, and PNG only", () => {
    expect(isAllowedEbookPdfUpload(named("book.pdf", "application/pdf"))).toBe(true);
    expect(isAllowedEbookImageUpload(named("a.jpg", "image/jpeg"))).toBe(true);
    expect(isAllowedEbookImageUpload(named("a.jpeg", "image/jpeg"))).toBe(true);
    expect(isAllowedEbookImageUpload(named("a.png", "image/png"))).toBe(true);
    expect(isAllowedEbookUpload(named("a.JPG", "image/jpeg"))).toBe(true);
    expect(EBOOK_UPLOAD_ACCEPT).not.toMatch(/webp|heic|heif/i);
  });

  it("rejects WEBP, HEIC, and HEIF by name and MIME", () => {
    expect(isProhibitedEbookImageUpload(named("x.webp", "image/webp"))).toBe(true);
    expect(isProhibitedEbookImageUpload(named("x.heic", "image/heic"))).toBe(true);
    expect(isProhibitedEbookImageUpload(named("x.heif", "image/heif"))).toBe(true);
    expect(isAllowedEbookImageUpload(named("x.webp", "image/webp"))).toBe(false);
    expect(isAllowedEbookImageUpload(named("x.heic", "image/heic"))).toBe(false);
    expect(isAllowedEbookImageUpload(named("x.heif", "image/heif"))).toBe(false);
    expect(classifyUploadFile(new File([""], "x.webp", { type: "image/webp" }))).toBe(
      "other",
    );
    expect(classifyUploadFile(new File([""], "x.heic", { type: "image/heic" }))).toBe(
      "other",
    );
    expect(classifyUploadFile(new File([""], "page.jpg", { type: "image/jpeg" }))).toBe(
      "image",
    );
    expect(classifyUploadFile(new File([""], "book.pdf", { type: "application/pdf" }))).toBe(
      "pdf",
    );
  });

  it("rejects WEBP and HEIC bytes even when the filename looks like JPEG", async () => {
    const jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#112233" },
    })
      .jpeg()
      .toBuffer();
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#445566" },
    })
      .png()
      .toBuffer();
    const webp = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#778899" },
    })
      .webp()
      .toBuffer();

    await expect(
      assertAllowedEbookImageBuffer(jpeg, named("ok.jpg", "image/jpeg")),
    ).resolves.toBeUndefined();
    await expect(
      assertAllowedEbookImageBuffer(png, named("ok.png", "image/png")),
    ).resolves.toBeUndefined();
    await expect(
      assertAllowedEbookImageBuffer(webp, named("disguised.jpg", "image/jpeg")),
    ).rejects.toThrow(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
    await expect(
      assertAllowedEbookImageBuffer(jpeg, named("photo.webp", "image/jpeg")),
    ).rejects.toThrow(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
    await expect(
      assertAllowedEbookImageBuffer(jpeg, named("photo.heic", "image/heic")),
    ).rejects.toThrow(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
    expect(isAllowedEbookImageFormatName("webp")).toBe(false);
    expect(isAllowedEbookImageFormatName("heic")).toBe(false);
    expect(isAllowedEbookImageFormatName("heif")).toBe(false);
    expect(isAllowedEbookImageFormatName("jpeg")).toBe(true);
  });
});
