import {
  nextClientOptimizePass,
  payloadTooLargeMessage,
  type ClientOptimizePass,
} from "@/lib/media/client-optimize-plan";
import { optimizeImageFileForUpload } from "@/lib/media/client-optimize-upload-image";
import type { OptimizeImageKind } from "@/lib/media/upload-size-limits";

export type EbookOptimizedUploadResponse = {
  ok: true;
  url: string;
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
  mimeType: string;
  kind: OptimizeImageKind;
  compressionRatio: number;
};

const UPLOAD_MAX_ATTEMPTS = 3;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message)))
  );
}

function isTransientUploadError(error: unknown): boolean {
  if (isAbortError(error)) return false;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch failed") ||
    /\b5\d\d\b/.test(message)
  );
}

function isPayloadTooLargeError(error: unknown, status?: number): boolean {
  if (status === 413) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("too large for a single upload") ||
    message.includes("http 413") ||
    message.includes("triggered http 413")
  );
}

/**
 * Client-shrink then POST one image. HTTP 413 retries with a stricter
 * optimize pass instead of re-sending the same oversized blob.
 */
export async function postEbookGenerateOptimizedImage(options: {
  requestId?: string;
  mapsiteId?: string;
  kind: OptimizeImageKind;
  file: File;
  label: string;
  signal?: AbortSignal;
  minPass?: ClientOptimizePass;
}): Promise<EbookOptimizedUploadResponse> {
  let lastError: Error | null = null;
  let pass: ClientOptimizePass = options.minPass ?? "default";

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException("Upload aborted.", "AbortError");
    }

    try {
      const fileToSend = await optimizeImageFileForUpload(options.file, {
        kind: options.kind,
        minPass: pass,
        label: options.label,
      });

      const fd = new FormData();
      if (options.requestId) fd.set("requestId", options.requestId);
      if (options.mapsiteId) fd.set("mapsiteId", options.mapsiteId);
      fd.set("kind", options.kind);
      fd.set("label", options.label);
      fd.set("file", fileToSend, fileToSend.name || options.label || "image.jpg");

      const response = await fetch("/api/talispros/ebook-generate/upload-image", {
        method: "POST",
        body: fd,
        signal: options.signal,
      });

      let payload: {
        ok?: boolean;
        error?: string;
      } & Partial<EbookOptimizedUploadResponse>;
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        throw new Error(
          response.status === 413
            ? payloadTooLargeMessage(
                options.label,
                Boolean(nextClientOptimizePass(pass)),
              )
            : `Failed to upload “${options.label}” (${response.status || "network"}).`,
        );
      }

      if (!response.ok || !payload.ok || !payload.url) {
        if (response.status === 413) {
          throw new Error(
            payloadTooLargeMessage(
              options.label,
              Boolean(nextClientOptimizePass(pass)),
            ),
          );
        }
        throw new Error(
          payload.error || `Failed to optimize and upload “${options.label}”.`,
        );
      }

      return payload as EbookOptimizedUploadResponse;
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError =
        error instanceof Error
          ? error
          : new Error(`Failed to upload “${options.label}”.`);

      const nextPass = nextClientOptimizePass(pass);
      if (isPayloadTooLargeError(lastError) && nextPass) {
        console.warn(
          `[onboarding] Upload 413 — retrying “${options.label}” with ${nextPass} compression`,
        );
        pass = nextPass;
        continue;
      }

      const canRetry =
        attempt < UPLOAD_MAX_ATTEMPTS && isTransientUploadError(lastError);
      if (!canRetry) break;

      console.warn(
        `[onboarding] Upload retry ${attempt}/${UPLOAD_MAX_ATTEMPTS} for “${options.label}”:`,
        lastError.message,
      );
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError || new Error(`Failed to upload “${options.label}”.`);
}

export { isAbortError };
