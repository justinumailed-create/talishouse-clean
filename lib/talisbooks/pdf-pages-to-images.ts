/**
 * Client-side PDF → JPEG page rasters for the Self-Service TalisBook™ creator.
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
  const pdfjs = await import("pdfjs-dist");

  // Match installed package version; CDN worker avoids Next bundler worker issues.
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
}

export { MAX_PAGES as MAX_EBOOK_UPLOAD_PAGES };
