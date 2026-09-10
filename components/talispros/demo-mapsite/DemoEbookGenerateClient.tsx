"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateDemoEbookAction } from "@/app/talispros/demo-mapsite/actions";
import {
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import {
  fallbackOptimizedDemoPages,
  fetchWithTimeout,
  loadPinnedTalisBookPageFiles,
} from "@/lib/talisbooks/load-pinned-demo-pages";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { ONBOARDING_JOB_TIMEOUT_MS } from "@/lib/onboarding-timing";

type OptimizedAsset = {
  url: string;
  width: number;
  height: number;
};

const UPLOAD_CONCURRENCY = 2;
const UPLOAD_TIMEOUT_MS = 60_000;
const UPLOAD_MAX_ATTEMPTS = 2;

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error &&
      (error.name === "AbortError" || /aborted|timed out/i.test(error.message)))
  );
}

function isTransientUploadError(error: unknown): boolean {
  if (isAbortError(error)) return true;
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

async function uploadOptimizedPage(options: {
  mapsiteId: string;
  file: File;
  index: number;
}): Promise<OptimizedAsset> {
  const label = options.file.name || `page-${options.index + 1}.jpg`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    try {
      const fd = new FormData();
      fd.set("mapsiteId", options.mapsiteId);
      fd.set("kind", "property");
      fd.set("label", label);
      fd.set("file", options.file, label);
      const response = await fetchWithTimeout(
        "/api/talispros/ebook-generate/upload-image",
        { method: "POST", body: fd },
        UPLOAD_TIMEOUT_MS,
      );
      let payload: {
        ok?: boolean;
        error?: string;
        url?: string;
        width?: number;
        height?: number;
      };
      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        throw new Error(
          response.status === 413
            ? `“${label}” is too large for a single upload.`
            : `Failed to optimize page ${options.index + 1} (${response.status || "network"}).`,
        );
      }
      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(
          payload.error || `Failed to optimize page ${options.index + 1}.`,
        );
      }
      return {
        url: payload.url,
        width: Number(payload.width) || 1,
        height: Number(payload.height) || 1,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`Failed to optimize page ${options.index + 1}.`);
      const canRetry =
        attempt < UPLOAD_MAX_ATTEMPTS && isTransientUploadError(lastError);
      if (!canRetry) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError || new Error(`Failed to optimize page ${options.index + 1}.`);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function DemoEbookGenerateClient({
  mapsiteId,
  title,
}: {
  mapsiteId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<File[]>([]);
  const [optimized, setOptimized] = useState<OptimizedAsset[]>([]);

  async function extractPinnedPdf() {
    setError(null);
    setOptimized([]);
    setBusy(true);
    setStage("Loading pinned Talispros eBook pages…");
    try {
      const pageFiles = await loadPinnedTalisBookPageFiles({
        onProgress: (done, total) => {
          setStage(`Extracting pages: ${done} of ${total}…`);
        },
      });
      setPages(pageFiles);
      setStage(
        `${pageFiles.length} pages extracted. Optimize them, then build the Talisbook™.`,
      );
    } catch (caught) {
      setPages([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not extract the pinned PDF.",
      );
      setStage("");
    } finally {
      setBusy(false);
    }
  }

  async function optimizePages() {
    if (pages.length === 0) {
      setError("Extract the pinned PDF first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let usedPinnedFallback = false;
      let uploadError: string | null = null;
      const uploaded = await mapPool(pages, UPLOAD_CONCURRENCY, async (file, index) => {
        setStage(`Optimizing page ${index + 1} of ${pages.length}…`);
        try {
          return await uploadOptimizedPage({ mapsiteId, file, index });
        } catch (caught) {
          const fallback = fallbackOptimizedDemoPages(pages.length)[index];
          if (!fallback) {
            throw caught;
          }
          usedPinnedFallback = true;
          uploadError =
            caught instanceof Error ? caught.message : "Image upload failed.";
          console.warn(
            `[demo-ebook] Upload failed for page ${index + 1}; using pinned page asset.`,
            uploadError,
          );
          return fallback;
        }
      });
      setOptimized(uploaded);
      setStage(
        usedPinnedFallback
          ? `${uploaded.length} pages ready using pinned assets. ${uploadError || "upload-image was unavailable."} You can still Build.`
          : `${uploaded.length} pages optimized and ready to build.`,
      );
    } catch (caught) {
      setOptimized([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not optimize the demonstration pages.",
      );
      setStage("");
    } finally {
      setBusy(false);
    }
  }

  async function buildEbook() {
    if (optimized.length === 0) {
      setError("Optimize the extracted pages first.");
      return;
    }
    setError(null);
    setBusy(true);
    setStage("Building demonstration Talisbook™…");
    try {
      const result = await withTimeout(
        generateDemoEbookAction({
          mapsiteId,
          optimizedImages: optimized,
        }),
        ONBOARDING_JOB_TIMEOUT_MS,
        "Generation timed out. Please try Build again.",
      );
      if (!result.ok) {
        throw new Error(result.error);
      }
      setStage("Opening your demo Mapsite™…");
      router.push(result.mapsiteHref);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not generate the demonstration Talisbook™.",
      );
      setStage("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600">
        Listing: <span className="font-medium text-neutral-900">{title}</span>
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => void extractPinnedPdf()}
        className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {busy && pages.length === 0 && optimized.length === 0
          ? "Extracting PDF…"
          : "Extract PDF from pinned Talispros eBook"}
      </button>

      {pages.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {pages.length} page{pages.length === 1 ? "" : "s"} extracted and ready
          to optimize.
        </div>
      ) : null}

      {pages.length > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void optimizePages()}
          className="w-full rounded-2xl border border-neutral-900 px-5 py-3.5 text-base font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {busy && pages.length > 0 && optimized.length === 0
            ? "Optimizing pages…"
            : "Optimize pages"}
        </button>
      ) : null}

      {optimized.length > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void buildEbook()}
          className="w-full rounded-2xl bg-neutral-900 px-5 py-3.5 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {busy && optimized.length > 0
            ? "Building Talisbook™…"
            : "Build Talisbook™"}
        </button>
      ) : null}

      {stage ? <p className="text-sm text-neutral-500">{stage}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-center text-xs text-neutral-500">
        Extract the pinned sample pages, optimize them, then build. Storage is
        used when available; pinned page assets are used if upload-image is not
        configured.{" "}
        <a
          href={`${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`}
          className="underline underline-offset-2"
        >
          View pinned eBook
        </a>
      </p>
    </div>
  );
}
