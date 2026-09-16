/** Allowed source uploads for Generate My Own E-Book. Storage may still re-encode. */

export const EBOOK_UPLOAD_ACCEPT =
  "application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png";

export const EBOOK_IMAGE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

export const EBOOK_UPLOAD_UNSUPPORTED_MESSAGE =
  "Use PDF, JPG, JPEG, or PNG. WEBP, HEIC, and HEIF are not allowed.";

const PROHIBITED_EXTENSION = /\.(webp|heic|heif)$/i;
const PROHIBITED_MIME = /^(image\/webp|image\/heic|image\/heif|image\/heic-sequence)$/i;
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
]);
const ALLOWED_IMAGE_EXTENSION = /\.(jpe?g|png)$/i;
const PDF_MIME = new Set(["application/pdf", "application/x-pdf"]);

function fileName(value: { name?: string } | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || "";
}

function fileType(value: { type?: string } | string | null | undefined): string {
  if (!value || typeof value === "string") return "";
  return (value.type || "").trim().toLowerCase();
}

export function isProhibitedEbookImageUpload(
  file: { name?: string; type?: string } | File,
): boolean {
  const name = fileName(file).toLowerCase();
  const type = fileType(file);
  return PROHIBITED_EXTENSION.test(name) || PROHIBITED_MIME.test(type);
}

export function isAllowedEbookPdfUpload(
  file: { name?: string; type?: string } | File,
): boolean {
  const name = fileName(file).toLowerCase();
  const type = fileType(file);
  return PDF_MIME.has(type) || name.endsWith(".pdf");
}

export function isAllowedEbookImageUpload(
  file: { name?: string; type?: string } | File,
): boolean {
  if (isProhibitedEbookImageUpload(file)) return false;
  const name = fileName(file).toLowerCase();
  const type = fileType(file);
  if (ALLOWED_IMAGE_MIME.has(type)) return true;
  if (!type && ALLOWED_IMAGE_EXTENSION.test(name)) return true;
  if (ALLOWED_IMAGE_EXTENSION.test(name) && type.startsWith("image/")) {
    return ALLOWED_IMAGE_MIME.has(type);
  }
  return ALLOWED_IMAGE_EXTENSION.test(name) && !type;
}

export function isAllowedEbookUpload(
  file: { name?: string; type?: string } | File,
): boolean {
  return isAllowedEbookPdfUpload(file) || isAllowedEbookImageUpload(file);
}

export function isAllowedEbookImageFormatName(
  format: string | null | undefined,
): boolean {
  const normalized = (format || "").trim().toLowerCase();
  return normalized === "jpeg" || normalized === "jpg" || normalized === "png";
}
