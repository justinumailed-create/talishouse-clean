import {
  AGENT_PHOTO_MAX_EDGE_PX,
  CLIENT_UPLOAD_MAX_BYTES,
  CLIENT_UPLOAD_SKIP_BYTES,
  LOGO_MAX_EDGE_PX,
  type OptimizeImageKind,
} from "@/lib/media/upload-size-limits";

export type ClientOptimizePass = "default" | "retry" | "last-resort";

export type ClientOptimizeStep = {
  pass: ClientOptimizePass;
  maxEdge: number;
  /** Canvas `toBlob` quality (0–1). Sharp uses `Math.round(quality * 100)`. */
  quality: number;
  targetBytes: number;
};

const PASS_ORDER: readonly ClientOptimizePass[] = [
  "default",
  "retry",
  "last-resort",
];

/**
 * Multi-pass shrink plan. First upload starts at `default` and may walk
 * later passes if the photo stays over the Vercel body budget.
 * UI Retry starts at `retry` so it is strictly smaller/lower-quality.
 */
export const CLIENT_OPTIMIZE_STEPS: readonly ClientOptimizeStep[] = [
  { pass: "default", maxEdge: 2048, quality: 0.86, targetBytes: 1_500_000 },
  { pass: "default", maxEdge: 2048, quality: 0.78, targetBytes: 1_500_000 },
  { pass: "default", maxEdge: 1920, quality: 0.74, targetBytes: 1_200_000 },
  { pass: "default", maxEdge: 1600, quality: 0.72, targetBytes: 1_000_000 },
  { pass: "retry", maxEdge: 1600, quality: 0.68, targetBytes: 900_000 },
  { pass: "retry", maxEdge: 1440, quality: 0.62, targetBytes: 750_000 },
  { pass: "retry", maxEdge: 1280, quality: 0.58, targetBytes: 650_000 },
  { pass: "last-resort", maxEdge: 1280, quality: 0.52, targetBytes: 500_000 },
  { pass: "last-resort", maxEdge: 1024, quality: 0.48, targetBytes: 400_000 },
  { pass: "last-resort", maxEdge: 960, quality: 0.42, targetBytes: 350_000 },
];

export function nextClientOptimizePass(
  pass: ClientOptimizePass,
): ClientOptimizePass | null {
  const index = PASS_ORDER.indexOf(pass);
  return PASS_ORDER[index + 1] ?? null;
}

export function clientOptimizeStepsFrom(
  minPass: ClientOptimizePass,
): ClientOptimizeStep[] {
  const start = PASS_ORDER.indexOf(minPass);
  return CLIENT_OPTIMIZE_STEPS.filter(
    (step) => PASS_ORDER.indexOf(step.pass) >= start,
  );
}

export function maxEdgeForKind(
  kind: OptimizeImageKind,
  stepMaxEdge: number,
): number {
  if (kind === "agent") return Math.min(stepMaxEdge, AGENT_PHOTO_MAX_EDGE_PX);
  if (kind === "logo") return Math.min(stepMaxEdge, LOGO_MAX_EDGE_PX);
  return stepMaxEdge;
}

export function shouldSkipClientOptimize(options: {
  byteLength: number;
  minPass: ClientOptimizePass;
  kind: OptimizeImageKind;
}): boolean {
  if (options.kind === "logo") {
    return (
      options.minPass === "default" &&
      options.byteLength <= CLIENT_UPLOAD_MAX_BYTES
    );
  }
  return (
    options.minPass === "default" &&
    options.byteLength <= CLIENT_UPLOAD_SKIP_BYTES
  );
}

export function formatUploadMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function stillTooLargeAfterOptimizeMessage(
  label: string,
  bytes: number,
): string {
  return `“${label}” is still ${formatUploadMegabytes(bytes)} after maximum compression — too large to upload. Try a smaller crop or a different photo.`;
}

export function payloadTooLargeMessage(label: string, canRetry: boolean): string {
  return canRetry
    ? `“${label}” is too large for a single upload. Retry will compress it further.`
    : stillTooLargeAfterOptimizeMessage(label, CLIENT_UPLOAD_MAX_BYTES);
}

export function decodeFailedMessage(label: string): string {
  return `“${label}” could not be decoded in the browser. If this is HEIC/HEIF, export a JPEG and try again.`;
}

export function jpegFileName(name: string): string {
  const trimmed = name.trim() || "image.jpg";
  return /\.[a-z0-9]+$/i.test(trimmed)
    ? trimmed.replace(/\.[a-z0-9]+$/i, ".jpg")
    : `${trimmed}.jpg`;
}

export type ClientEncodeResult = {
  bytes: Uint8Array;
  mimeType: "image/jpeg";
  width: number;
  height: number;
};

/**
 * Walk shrink steps until the encoding fits the upload budget.
 * Encoder is injected so Node tests can use Sharp and the browser can use canvas.
 */
export async function pickClientOptimizeEncoding(options: {
  originalBytes: number;
  kind: OptimizeImageKind;
  minPass: ClientOptimizePass;
  label?: string;
  encode: (step: {
    maxEdge: number;
    quality: number;
  }) => Promise<ClientEncodeResult>;
}): Promise<
  | { skipped: true }
  | { skipped: false; result: ClientEncodeResult; pass: ClientOptimizePass }
> {
  if (
    shouldSkipClientOptimize({
      byteLength: options.originalBytes,
      minPass: options.minPass,
      kind: options.kind,
    })
  ) {
    return { skipped: true };
  }

  let best: { result: ClientEncodeResult; pass: ClientOptimizePass } | null =
    null;

  for (const step of clientOptimizeStepsFrom(options.minPass)) {
    const encoded = await options.encode({
      maxEdge: maxEdgeForKind(options.kind, step.maxEdge),
      quality: step.quality,
    });
    if (!best || encoded.bytes.byteLength < best.result.bytes.byteLength) {
      best = { result: encoded, pass: step.pass };
    }
    const fitsGate = encoded.bytes.byteLength <= CLIENT_UPLOAD_MAX_BYTES;
    if (fitsGate && encoded.bytes.byteLength <= step.targetBytes) {
      return { skipped: false, result: encoded, pass: step.pass };
    }
  }

  if (best && best.result.bytes.byteLength <= CLIENT_UPLOAD_MAX_BYTES) {
    return { skipped: false, result: best.result, pass: best.pass };
  }

  if (options.originalBytes <= CLIENT_UPLOAD_MAX_BYTES) {
    return { skipped: true };
  }

  const failedBytes = best?.result.bytes.byteLength ?? options.originalBytes;
  throw new Error(
    stillTooLargeAfterOptimizeMessage(options.label || "image", failedBytes),
  );
}
