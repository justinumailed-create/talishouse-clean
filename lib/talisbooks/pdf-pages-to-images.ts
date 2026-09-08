/**
 * Client-side PDF → JPEG page rasters for the Self-Service Talisbook™ creator.
 * Each PDF page becomes one image File so the existing viewer pipeline stays unchanged.
 */

const MAX_PAGES = 22;

function isPdfFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    file.type === "application/x-pdf" ||
    name.endsWith(".pdf")
  );
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function classifyUploadFile(file: File): "image" | "pdf" | "other" {
  if (isPdfFile(file)) return "pdf";
  if (isImageFile(file)) return "image";
  return "other";
}

async function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not export PDF page as an image."));
      },
      "image/jpeg",
      0.92
    );
  });
  return new File([blob], fileName, { type: "image/jpeg" });
}

/**
 * Rasterize each PDF page to a JPEG File (same visual page → viewer page).
 */
export async function convertPdfFileToImageFiles(
  file: File,
  options?: { maxPages?: number; onProgress?: (done: number, total: number) => void }
): Promise<File[]> {
  const maxPages = options?.maxPages ?? MAX_PAGES;
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const data = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data }).promise;
    const pageCount = Math.min(document.numPages, maxPages);
    const baseName = file.name.replace(/\.pdf$/i, "") || "pdf";
    const pages: File[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas is not available to convert PDF pages.");
      }

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      pages.push(
        await canvasToJpegFile(
          canvas,
          `${baseName}-page-${String(pageNumber).padStart(2, "0")}.jpg`
        )
      );
      options?.onProgress?.(pageNumber, pageCount);
    }

    return pages;
  } catch (caught) {
    if (caught instanceof Error && caught.message && !caught.message.startsWith("Canvas")) {
      throw new Error(
        caught.message.includes("PDF")
          ? caught.message
          : `Could not read the PDF. ${caught.message}`,
      );
    }
    throw caught instanceof Error
      ? caught
      : new Error("Could not read the PDF.");
  }
}

export { MAX_PAGES as MAX_EBOOK_UPLOAD_PAGES };

export const COVER_WRAP_PDF_HELP =
  "Upload one PDF. Page 1 is the wrap cover: the left side becomes the back cover, and the right side becomes the front cover. Remaining pages become the interior.";

export const COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE =
  "The first page or image must be a landscape wrap cover. The left side is the back cover, and the right side is the front cover.";

export const PDF_NEEDS_INTERIOR_PAGES_MESSAGE =
  "Upload a PDF with at least two pages, or at least two images. The first is the wrap cover; the rest are interiors.";

async function cropBitmapToJpegFile(
  bitmap: ImageBitmap,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  fileName: string,
): Promise<File> {
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(sw));
  canvas.height = Math.max(1, Math.floor(sh));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available to split the cover PDF.");
  }
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvasToJpegFile(canvas, fileName);
}

/**
 * Split a landscape wrap raster: LEFT = back cover, RIGHT = front cover.
 */
export async function splitWrapCoverImageFile(file: File): Promise<{
  front: File;
  back: File;
}> {
  const bitmap = await createImageBitmap(file);
  try {
    const leftWidth = Math.max(1, Math.floor(bitmap.width / 2));
    const rightWidth = Math.max(1, bitmap.width - leftWidth);
    const [back, front] = await Promise.all([
      cropBitmapToJpegFile(bitmap, 0, 0, leftWidth, bitmap.height, "back-cover.jpg"),
      cropBitmapToJpegFile(
        bitmap,
        leftWidth,
        0,
        rightWidth,
        bitmap.height,
        "front-cover.jpg",
      ),
    ]);
    return { front, back };
  } finally {
    bitmap.close();
  }
}

/**
 * Rasterize PDF page 1 and split it as a wrap cover (left = back, right = front).
 */
export async function splitWrapCoverPdfFile(
  file: File,
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<{ front: File; back: File }> {
  const pages = await convertPdfFileToImageFiles(file, {
    maxPages: 1,
    onProgress: options?.onProgress,
  });
  const page = pages[0];
  if (!page) {
    throw new Error("Could not read the cover PDF.");
  }
  return splitWrapCoverImageFile(page);
}

/**
 * One PDF upload: page 1 is the wrap cover (left = back, right = front);
 * remaining pages are interiors.
 */
export async function convertPdfToWrapCoverAndInteriors(
  file: File,
  options?: {
    maxInteriorPages?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ front: File; back: File; interiors: File[] }> {
  const maxInteriorPages = options?.maxInteriorPages ?? MAX_PAGES - 1;
  const pages = await convertPdfFileToImageFiles(file, {
    maxPages: Math.max(2, 1 + maxInteriorPages),
    onProgress: options?.onProgress,
  });
  const coverPage = pages[0];
  if (!coverPage) {
    throw new Error("Could not read the PDF.");
  }
  const { front, back } = await splitWrapCoverImageFile(coverPage);
  const interiors = pages.slice(1);
  if (interiors.length === 0) {
    throw new Error(PDF_NEEDS_INTERIOR_PAGES_MESSAGE);
  }
  return { front, back, interiors };
}

function sortBookImageFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

/**
 * One PDF, or a set of images: the first page/file is the wrap cover
 * (left = back, right = front); remaining pages/files are interiors.
 */
export async function assignBookAssetsFromUploads(
  files: File[],
  options?: {
    maxInteriorPages?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{
  front: File;
  back: File;
  interiors: File[];
  source: "pdf" | "images";
}> {
  const incoming = files.filter(Boolean);
  if (incoming.length === 0) {
    throw new Error(PDF_NEEDS_INTERIOR_PAGES_MESSAGE);
  }

  const kinds = incoming.map((file) => ({ file, kind: classifyUploadFile(file) }));
  if (kinds.some((item) => item.kind === "other")) {
    throw new Error("Unsupported file. Use JPG, PNG, WEBP, or PDF.");
  }

  const pdfs = kinds.filter((item) => item.kind === "pdf").map((item) => item.file);
  const images = kinds.filter((item) => item.kind === "image").map((item) => item.file);

  if (pdfs.length > 0 && images.length > 0) {
    throw new Error("Upload either one PDF or a set of images, not both.");
  }
  if (pdfs.length > 1) {
    throw new Error("Upload one PDF, or upload images instead.");
  }

  if (pdfs.length === 1) {
    const converted = await convertPdfToWrapCoverAndInteriors(pdfs[0]!, options);
    return { ...converted, source: "pdf" };
  }

  const ordered = sortBookImageFiles(images);
  const coverFile = ordered[0];
  const interiors = ordered.slice(1, 1 + (options?.maxInteriorPages ?? MAX_PAGES - 1));
  if (!coverFile || interiors.length === 0) {
    throw new Error(PDF_NEEDS_INTERIOR_PAGES_MESSAGE);
  }
  options?.onProgress?.(1, interiors.length + 1);
  const { front, back } = await splitWrapCoverImageFile(coverFile);
  options?.onProgress?.(interiors.length + 1, interiors.length + 1);
  return { front, back, interiors, source: "images" };
}
