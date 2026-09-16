import sharp from "sharp";
import {
  EBOOK_UPLOAD_UNSUPPORTED_MESSAGE,
  isAllowedEbookImageFormatName,
  isAllowedEbookImageUpload,
  isAllowedEbookPdfUpload,
  isProhibitedEbookImageUpload,
} from "@/lib/talisbooks/ebook-upload-formats";

type NamedUpload = { name?: string; type?: string };

export async function assertAllowedEbookImageBuffer(
  buffer: Buffer,
  file?: NamedUpload | File,
): Promise<void> {
  if (file && isProhibitedEbookImageUpload(file)) {
    throw new Error(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
  }
  if (file && isAllowedEbookPdfUpload(file)) return;
  if (file && !isAllowedEbookImageUpload(file) && file.name) {
    throw new Error(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
  }

  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  if (!isAllowedEbookImageFormatName(metadata.format)) {
    throw new Error(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
  }
}

export async function assertAllowedEbookUploadFile(file: File): Promise<void> {
  if (isAllowedEbookPdfUpload(file)) return;
  if (isProhibitedEbookImageUpload(file) || !isAllowedEbookImageUpload(file)) {
    throw new Error(EBOOK_UPLOAD_UNSUPPORTED_MESSAGE);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  await assertAllowedEbookImageBuffer(buffer, file);
}

export function rejectDisallowedEbookFiles(files: File[]): string | null {
  for (const file of files) {
    if (isAllowedEbookPdfUpload(file)) continue;
    if (isProhibitedEbookImageUpload(file) || !isAllowedEbookImageUpload(file)) {
      return EBOOK_UPLOAD_UNSUPPORTED_MESSAGE;
    }
  }
  return null;
}
