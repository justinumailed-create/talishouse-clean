import {
  decodeFailedMessage,
  jpegFileName,
  pickClientOptimizeEncoding,
  type ClientOptimizePass,
} from "@/lib/media/client-optimize-plan";
import type { OptimizeImageKind } from "@/lib/media/upload-size-limits";
import { CLIENT_UPLOAD_MAX_BYTES } from "@/lib/media/upload-size-limits";

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) resolve(blob);
        else reject(new Error("Could not compress this photo in the browser."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function decodeImageBitmap(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    return await createImageBitmap(file);
  }
}

function drawScaledCanvas(
  bitmap: ImageBitmap,
  maxEdge: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available to compress this photo.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

/**
 * Shrink a phone photo in the browser so the POST body fits Vercel's 4.5 MB
 * function limit. Retry passes start later in the plan (smaller/lower quality).
 */
export async function optimizeImageFileForUpload(
  file: File,
  options: {
    kind: OptimizeImageKind;
    minPass?: ClientOptimizePass;
    label?: string;
  },
): Promise<File> {
  const label = options.label || file.name || "image";
  const minPass = options.minPass ?? "default";

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImageBitmap(file);
  } catch {
    if (file.size <= CLIENT_UPLOAD_MAX_BYTES) {
      return file;
    }
    throw new Error(decodeFailedMessage(label));
  }

  try {
    const picked = await pickClientOptimizeEncoding({
      originalBytes: file.size,
      kind: options.kind,
      minPass,
      label,
      encode: async ({ maxEdge, quality }) => {
        const { canvas, width, height } = drawScaledCanvas(bitmap, maxEdge);
        const blob = await canvasToJpegBlob(canvas, quality);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        return { bytes, mimeType: "image/jpeg" as const, width, height };
      },
    });

    if (picked.skipped) {
      return file;
    }

    return new File(
      [Uint8Array.from(picked.result.bytes)],
      jpegFileName(file.name || label),
      {
        type: "image/jpeg",
        lastModified: file.lastModified,
      },
    );
  } finally {
    bitmap.close();
  }
}
