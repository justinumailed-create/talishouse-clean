"use client";

import { useRef, useState } from "react";
import { generateDemoEbookAction } from "@/app/talispros/demo-mapsite/actions";
import {
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import {
  fallbackOptimizedDemoInteriorPagesAfterWrap,
  loadPinnedTalisBookPageFiles,
} from "@/lib/talisbooks/load-pinned-demo-pages";
import {
  assignBookAssetsFromUploads,
  COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE,
} from "@/lib/talisbooks/pdf-pages-to-images";
import { EBOOK_UPLOAD_ACCEPT } from "@/lib/talisbooks/ebook-upload-formats";
import { SELF_SERVICE_MAX_UPLOAD_IMAGES } from "@/lib/talisbooks/self-service-page-plan";
import {
  EBOOK_GENERATE_COVER_PDF_HELP,
  EBOOK_GENERATE_UPLOAD_HINT,
} from "@/lib/talispros/ebook-generate-copy";
import { postEbookGenerateOptimizedImage } from "@/lib/media/client-upload-ebook-image";
import {
  DEMO_MAPSITE_BUILD_PATH,
  publicDemoGenerateError,
} from "@/lib/talispros/demo-mapsite";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { ONBOARDING_JOB_TIMEOUT_MS } from "@/lib/onboarding-timing";
import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";
import Link from "next/link";
import { DemoVisaProgress } from "@/components/talispros/demo-mapsite/DemoVisaProgress";

type OptimizedAsset = {
  url: string;
  width: number;
  height: number;
};

type ProgressState = {
  label: string;
  detail?: string;
  current: number;
  total: number;
};

type BookSourceAssets = {
  front: File;
  back: File;
  interiors: File[];
  source: "pinned" | "upload";
  label: string;
};

const UPLOAD_CONCURRENCY = 2;
const UPLOAD_TIMEOUT_MS = 60_000;

const primaryButtonClass =
  "flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium text-white transition hover:brightness-95 disabled:opacity-40";

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

function uploadLabelFromFiles(files: File[]): string {
  if (files.length === 1) return files[0]!.name || "PDF uploaded";
  if (files.length > 1) {
    return `${files[0]!.name || "PDF"} + ${files.length - 1} more`;
  }
  return "PDF uploaded";
}

export default function DemoEbookGenerateClient({
  mapsiteId,
  title,
}: {
  mapsiteId: string;
  title: string;
}) {
  const [phase, setPhase] = useState<
    "idle" | "extracting" | "converting" | "optimizing" | "building"
  >("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<File[]>([]);
  const [coverFiles, setCoverFiles] = useState<{
    front: File;
    back: File;
  } | null>(null);
  const [pageSource, setPageSource] = useState<"pinned" | "upload">("pinned");
  const [sourceLabel, setSourceLabel] = useState("");
  const [optimized, setOptimized] = useState<OptimizedAsset[]>([]);
  const [optimizedCovers, setOptimizedCovers] = useState<{
    front: OptimizedAsset;
    back: OptimizedAsset;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runIdRef = useRef(0);
  const busy = phase !== "idle";
  const sourceReady = pages.length > 0 && Boolean(coverFiles);
  const optimizedReady = optimized.length > 0 && Boolean(optimizedCovers);

  function resetBookAssets() {
    setPages([]);
    setCoverFiles(null);
    setOptimized([]);
    setOptimizedCovers(null);
    setSourceLabel("");
  }

  function clearSourceAndReupload() {
    runIdRef.current += 1;
    resetBookAssets();
    setError(null);
    setStage("");
    setProgress(null);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function applyWrapCoverFromFiles(
    files: File[],
    source: "pinned" | "upload",
    label: string,
  ): Promise<BookSourceAssets> {
    const { front, back, interiors } = await assignBookAssetsFromUploads(
      files,
      {
        maxInteriorPages: SELF_SERVICE_MAX_UPLOAD_IMAGES,
        onProgress: (done, total) => {
          setStage(`Reading upload… ${done}/${total}`);
          setProgress({
            label: "Reading upload…",
            detail: `${done} of ${total}`,
            current: done,
            total,
          });
        },
      },
    );
    setPageSource(source);
    setCoverFiles({ front, back });
    setPages(interiors);
    setSourceLabel(label);
    setOptimized([]);
    setOptimizedCovers(null);
    setProgress(null);
    setStage(
      `Wrap cover from page 1 plus ${interiors.length} interior page${
        interiors.length === 1 ? "" : "s"
      }. Preparing Talisbook™…`,
    );
    return { front, back, interiors, source, label };
  }

  async function optimizePages(
    assets: BookSourceAssets,
    runId: number,
  ): Promise<{
    interiors: OptimizedAsset[];
    covers: { front: OptimizedAsset; back: OptimizedAsset };
  } | null> {
    const { front, back, interiors, source } = assets;
    if (interiors.length === 0) {
      setError("Extract the pinned PDF or upload a PDF first.");
      return null;
    }
    setError(null);
    setPhase("optimizing");
    const coverSteps = 1;
    const totalSteps = coverSteps + interiors.length;
    try {
      setStage("Optimizing wrap cover…");
      setProgress({
        label: "Optimizing pages…",
        detail: "Optimizing wrap cover…",
        current: 0,
        total: totalSteps,
      });
      const [frontCover, backCover] = await Promise.all([
        uploadOptimizedPage({
          mapsiteId,
          file: front,
          index: 0,
        }),
        uploadOptimizedPage({
          mapsiteId,
          file: back,
          index: 0,
        }),
      ]);
      if (runId !== runIdRef.current) return null;
      const covers = { front: frontCover, back: backCover };
      setOptimizedCovers(covers);
      setProgress({
        label: "Optimizing pages…",
        detail: `Cover ready · 0 of ${interiors.length} interiors`,
        current: coverSteps,
        total: totalSteps,
      });

      let usedPinnedFallback = false;
      let uploadError: string | null = null;
      let completedInteriors = 0;
      const pinnedInteriorFallbacks =
        source === "pinned"
          ? fallbackOptimizedDemoInteriorPagesAfterWrap()
          : [];
      const uploaded = await mapPool(
        interiors,
        UPLOAD_CONCURRENCY,
        async (file, index) => {
          try {
            const asset = await uploadOptimizedPage({ mapsiteId, file, index });
            completedInteriors += 1;
            const done = completedInteriors;
            if (runId === runIdRef.current) {
              setStage(`Optimizing page ${done} of ${interiors.length}…`);
              setProgress({
                label: "Optimizing pages…",
                detail: `Page ${done} of ${interiors.length}`,
                current: coverSteps + done,
                total: totalSteps,
              });
            }
            return asset;
          } catch (caught) {
            const fallback = pinnedInteriorFallbacks[index];
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
            completedInteriors += 1;
            const done = completedInteriors;
            if (runId === runIdRef.current) {
              setStage(`Optimizing page ${done} of ${interiors.length}…`);
              setProgress({
                label: "Optimizing pages…",
                detail: `Page ${done} of ${interiors.length}`,
                current: coverSteps + done,
                total: totalSteps,
              });
            }
            return fallback;
          }
        },
      );
      if (runId !== runIdRef.current) return null;
      setOptimized(uploaded);
      setProgress(null);
      setStage(
        usedPinnedFallback
          ? `${uploaded.length} interiors ready using pinned assets. ${uploadError || "upload-image was unavailable."} Ready to build.`
          : `Wrap cover and ${uploaded.length} pages ready. Build your Talisbook™.`,
      );
      return { interiors: uploaded, covers };
    } catch (caught) {
      if (runId !== runIdRef.current) return null;
      setOptimized([]);
      setOptimizedCovers(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not optimize the demonstration pages.",
      );
      setStage("");
      setProgress(null);
      return null;
    } finally {
      if (runId === runIdRef.current) {
        setPhase("idle");
      }
    }
  }

  async function extractPinnedPdf() {
    const runId = ++runIdRef.current;
    setError(null);
    resetBookAssets();
    setPhase("extracting");
    setStage("Loading pinned Talispros eBook pages…");
    setProgress({
      label: "Extracting pages…",
      detail: "Loading pinned Talispros eBook…",
      current: 0,
      total: 1,
    });
    try {
      const pageFiles = await loadPinnedTalisBookPageFiles({
        onProgress: (done, total) => {
          if (runId !== runIdRef.current) return;
          setStage(`Extracting pages: ${done} of ${total}…`);
          setProgress({
            label: "Extracting pages…",
            detail: `Page ${done} of ${total}`,
            current: done,
            total,
          });
        },
      });
      if (runId !== runIdRef.current) return;
      const assets = await applyWrapCoverFromFiles(
        pageFiles,
        "pinned",
        "Pinned Talispros eBook",
      );
      if (runId !== runIdRef.current) return;
      await optimizePages(assets, runId);
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      resetBookAssets();
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not extract the pinned PDF.",
      );
      setStage("");
      setProgress(null);
      setPhase("idle");
    }
  }

  async function handleBookFilesSelected(files: File[]) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    const runId = ++runIdRef.current;
    setError(null);
    resetBookAssets();
    setPhase("converting");
    setStage("Reading upload…");
    setProgress({
      label: "Reading upload…",
      detail: "Preparing pages…",
      current: 0,
      total: 1,
    });
    try {
      const assets = await applyWrapCoverFromFiles(
        files,
        "upload",
        uploadLabelFromFiles(files),
      );
      if (runId !== runIdRef.current) return;
      await optimizePages(assets, runId);
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      resetBookAssets();
      setError(
        caught instanceof Error
          ? caught.message
          : COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE,
      );
      setStage("");
      setProgress(null);
      setPhase("idle");
    }
  }

  async function buildEbook() {
    if (!optimizedReady || !optimizedCovers) {
      setError("Prepare pages first, then Build.");
      return;
    }
    const runId = runIdRef.current;
    setError(null);
    setPhase("building");
    setStage("Building demonstration Talisbook™…");
    setProgress({
      label: "Building Talisbook™…",
      detail: "Assembling your demonstration Talisbook™",
      current: 0,
      total: 0,
    });
    try {
      const result = await withTimeout(
        generateDemoEbookAction({
          mapsiteId,
          optimizedImages: optimized,
          frontCover: optimizedCovers.front,
          backCover: optimizedCovers.back,
        }),
        ONBOARDING_JOB_TIMEOUT_MS,
        "Generation timed out. Please try Build again.",
      );
      if (runId !== runIdRef.current) return;
      if (!result.ok) {
        throw new Error(result.error);
      }
      setStage("Opening your demo Mapsite™…");
      setProgress({
        label: "Opening Mapsite™…",
        detail: "Demonstration Talisbook™ ready",
        current: 1,
        total: 1,
      });
      // Full navigation avoids a failed App Router RSC render leaving this
      // page stuck on "Building demonstration Talisbook™…".
      window.location.assign(result.mapsiteHref || result.viewerUrl);
    } catch (caught) {
      if (runId !== runIdRef.current) return;
      setError(publicDemoGenerateError(caught));
      setStage("");
      setProgress(null);
    } finally {
      if (runId === runIdRef.current) {
        setPhase("idle");
      }
    }
  }

  async function retryOptimize() {
    if (!coverFiles || pages.length === 0) {
      setError("Extract the pinned PDF or upload a PDF first.");
      return;
    }
    const runId = ++runIdRef.current;
    await optimizePages(
      {
        front: coverFiles.front,
        back: coverFiles.back,
        interiors: pages,
        source: pageSource,
        label: sourceLabel,
      },
      runId,
    );
  }

  const cardClass =
    "overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]";

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-[#f5f5f7] px-6 py-16 text-neutral-950 antialiased sm:py-24">
      <Link
        href={DEMO_MAPSITE_BUILD_PATH}
        className="absolute left-6 top-6 text-[12px] tracking-tight text-neutral-400 transition hover:text-neutral-600"
      >
        Back to pin placement
      </Link>
      <a
        href={`${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`}
        className="absolute right-6 top-6 text-[12px] tracking-tight text-neutral-400 transition hover:text-neutral-600"
      >
        View pinned eBook
      </a>
      <div className="w-full max-w-[480px]">
        <div className="text-center">
          <p className="text-[12px] font-medium tracking-[0.22em] text-neutral-400">
            DEMONSTRATION
          </p>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
            Create the demo Talisbook™
          </h1>
          <p className="mx-auto mt-4 max-w-[26rem] text-[22px] font-semibold leading-snug tracking-[-0.03em] text-neutral-950">
            Extract the pinned pages, or upload a PDF.
          </p>
          <p className="mx-auto mt-2 max-w-[26rem] text-[13px] leading-relaxed text-neutral-500">
            We prepare the pages automatically. Then Build the demonstration
            Talisbook™ — when that finishes, we open your demo Mapsite™.
          </p>
          <p className="mt-3 text-[12px] tracking-tight text-neutral-400">
            {title}
          </p>
        </div>

        <div className="mt-12 space-y-5">
          <div className={`${cardClass} space-y-3 px-6 py-7`}>
            {!sourceReady ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void extractPinnedPdf()}
                  className={primaryButtonClass}
                  style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
                >
                  Extract PDF from pinned Talispros eBook
                </button>

                <div className="flex items-center gap-3 px-1">
                  <span className="h-px flex-1 bg-black/[0.08]" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    or
                  </span>
                  <span className="h-px flex-1 bg-black/[0.08]" />
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  className={primaryButtonClass}
                  style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
                >
                  Upload PDF
                </button>
                <p className="text-center text-[12px] leading-relaxed text-neutral-400">
                  {EBOOK_GENERATE_COVER_PDF_HELP} {EBOOK_GENERATE_UPLOAD_HINT}
                </p>
              </>
            ) : (
              <div
                className="flex h-12 w-full items-center gap-3 rounded-full px-4 text-[15px] font-medium text-white"
                style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
                role="status"
                aria-live="polite"
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[13px] font-semibold"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {sourceLabel ||
                    (pageSource === "pinned"
                      ? "Pinned Talispros eBook"
                      : "PDF uploaded")}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={clearSourceAndReupload}
                  aria-label="Clear and re-upload"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[18px] leading-none transition hover:bg-white/25 disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={EBOOK_UPLOAD_ACCEPT}
              multiple
              disabled={busy}
              className="sr-only"
              onChange={(event) => {
                const files = event.target.files
                  ? Array.from(event.target.files)
                  : [];
                void handleBookFilesSelected(files);
              }}
            />

            {sourceReady && !optimizedReady && !busy && error ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void retryOptimize()}
                className={primaryButtonClass}
                style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
              >
                Try again
              </button>
            ) : null}

            {optimizedReady ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void buildEbook()}
                className={primaryButtonClass}
                style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
              >
                Build Talisbook™
              </button>
            ) : null}

            {progress ? (
              <DemoVisaProgress
                label={progress.label}
                detail={progress.detail}
                current={progress.current}
                total={progress.total}
              />
            ) : stage ? (
              <p className="text-center text-[13px] text-neutral-400">{stage}</p>
            ) : null}
            {error ? (
              <p className="text-center text-[13px] leading-relaxed text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <p className="text-center text-[12px] leading-relaxed text-neutral-400">
            Extract the pinned sample pages or upload a PDF. Page 1 becomes
            the wrap cover; remaining pages become interiors. Storage is used
            when available; pinned interior assets are used if upload-image is
            not configured.
          </p>
        </div>
      </div>
    </div>
  );
}
