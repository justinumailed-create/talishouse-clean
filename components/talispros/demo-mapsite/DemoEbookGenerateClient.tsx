"use client";

import { useState } from "react";
import { generateDemoEbookAction } from "@/app/talispros/demo-mapsite/actions";
import {
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import {
  fallbackOptimizedDemoPages,
  loadPinnedTalisBookPageFiles,
} from "@/lib/talisbooks/load-pinned-demo-pages";
import { postEbookGenerateOptimizedImage } from "@/lib/media/client-upload-ebook-image";
import {
  DEMO_MAPSITE_BUILD_PATH,
  publicDemoGenerateError,
} from "@/lib/talispros/demo-mapsite";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { ONBOARDING_JOB_TIMEOUT_MS } from "@/lib/onboarding-timing";
import Link from "next/link";

type OptimizedAsset = {
  url: string;
  width: number;
  height: number;
};

const UPLOAD_CONCURRENCY = 2;
const UPLOAD_TIMEOUT_MS = 60_000;

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

async function uploadOptimizedPage(options: {
  mapsiteId: string;
  file: File;
  index: number;
}): Promise<OptimizedAsset> {
  const label = options.file.name || `page-${options.index + 1}.jpg`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const payload = await postEbookGenerateOptimizedImage({
      mapsiteId: options.mapsiteId,
      kind: "property",
      file: options.file,
      label,
      signal: controller.signal,
    });
    return {
      url: payload.url,
      width: Number(payload.width) || 1,
      height: Number(payload.height) || 1,
    };
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && /aborted|timed out/i.test(error.message))
    ) {
      throw new Error(`Timed out optimizing page ${options.index + 1}.`);
    }
    throw error instanceof Error
      ? error
      : new Error(`Failed to optimize page ${options.index + 1}.`);
  } finally {
    window.clearTimeout(timer);
  }
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
  const [phase, setPhase] = useState<
    "idle" | "extracting" | "optimizing" | "building"
  >("idle");
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<File[]>([]);
  const [optimized, setOptimized] = useState<OptimizedAsset[]>([]);
  const busy = phase !== "idle";

  async function extractPinnedPdf() {
    setError(null);
    setOptimized([]);
    setPhase("extracting");
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
      setPhase("idle");
    }
  }

  async function optimizePages() {
    if (pages.length === 0) {
      setError("Extract the pinned PDF first.");
      return;
    }
    setError(null);
    setPhase("optimizing");
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
      setPhase("idle");
    }
  }

  async function buildEbook() {
    if (optimized.length === 0) {
      setError("Optimize the extracted pages first.");
      return;
    }
    setError(null);
    setPhase("building");
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
      // Full navigation avoids a failed App Router RSC render leaving this
      // page stuck on "Building demonstration Talisbook™…".
      window.location.assign(result.mapsiteHref || result.viewerUrl);
    } catch (caught) {
      setError(publicDemoGenerateError(caught));
      setStage("");
    } finally {
      setPhase("idle");
    }
  }

  const cardClass =
    "overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]";

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#f5f5f7] px-6 py-16 text-neutral-950 antialiased sm:py-24">
      <div className="w-full max-w-[480px]">
        <div className="text-center">
          <p className="text-[12px] font-medium tracking-[0.22em] text-neutral-400">
            DEMONSTRATION
          </p>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
            Create the demo Talisbook™
          </h1>
          <p className="mx-auto mt-4 max-w-[26rem] text-[22px] font-semibold leading-snug tracking-[-0.03em] text-neutral-950">
            Extract the pinned pages.
          </p>
          <p className="mx-auto mt-2 max-w-[26rem] text-[13px] leading-relaxed text-neutral-500">
            Optimize them, then Build the demonstration Talisbook™. When that
            finishes, we open your demo Mapsite™.
          </p>
          <p className="mt-3 text-[12px] tracking-tight text-neutral-400">
            {title}
          </p>
        </div>

        <div className="mt-12 space-y-5">
          <div className={`${cardClass} space-y-3 px-6 py-7`}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void extractPinnedPdf()}
              className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-[15px] font-medium text-white transition disabled:opacity-40"
            >
              {phase === "extracting"
                ? "Extracting PDF…"
                : "Extract PDF from pinned Talispros eBook"}
            </button>

            {pages.length > 0 ? (
              <p className="text-center text-[13px] text-neutral-500">
                {pages.length} page{pages.length === 1 ? "" : "s"} extracted and
                ready to optimize.
              </p>
            ) : null}

            {pages.length > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void optimizePages()}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-neutral-950 transition hover:bg-[#dcdce2] disabled:opacity-40"
              >
                {phase === "optimizing" ? "Optimizing pages…" : "Optimize pages"}
              </button>
            ) : null}

            {optimized.length > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void buildEbook()}
                className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-[15px] font-medium text-white transition disabled:opacity-40"
              >
                {phase === "building" ? "Building Talisbook™…" : "Build Talisbook™"}
              </button>
            ) : null}

            {stage ? (
              <p className="text-center text-[13px] text-neutral-400">{stage}</p>
            ) : null}
            {error ? (
              <p className="text-center text-[13px] leading-relaxed text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <p className="text-center text-[12px] leading-relaxed text-neutral-400">
            Extract the pinned sample pages, optimize them, then build. Storage
            is used when available; pinned page assets are used if upload-image
            is not configured.
          </p>
          <p className="text-center text-[12px] tracking-tight text-neutral-400">
            <Link
              href={DEMO_MAPSITE_BUILD_PATH}
              className="transition hover:text-neutral-600"
            >
              Back to pin placement
            </Link>
            {" · "}
            <a
              href={`${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`}
              className="transition hover:text-neutral-600"
            >
              View pinned eBook
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
