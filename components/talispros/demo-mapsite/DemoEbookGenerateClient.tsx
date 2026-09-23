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
    "idle" | "extracting" | "converting" | "optimizing" | "building"
  >("idle");
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<File[]>([]);
  const [coverFiles, setCoverFiles] = useState<{
    front: File;
    back: File;
  } | null>(null);
  const [pageSource, setPageSource] = useState<"pinned" | "upload">("pinned");
  const [optimized, setOptimized] = useState<OptimizedAsset[]>([]);
  const [optimizedCovers, setOptimizedCovers] = useState<{
    front: OptimizedAsset;
    back: OptimizedAsset;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = phase !== "idle";

  function resetBookAssets() {
    setPages([]);
    setCoverFiles(null);
    setOptimized([]);
    setOptimizedCovers(null);
  }

  async function applyWrapCoverFromFiles(
    files: File[],
    source: "pinned" | "upload",
  ) {
    const { front, back, interiors } = await assignBookAssetsFromUploads(
      files,
      {
        maxInteriorPages: SELF_SERVICE_MAX_UPLOAD_IMAGES,
        onProgress: (done, total) => {
          setStage(`Reading upload… ${done}/${total}`);
        },
      },
    );
    setPageSource(source);
    setCoverFiles({ front, back });
    setPages(interiors);
    setStage(
      `Wrap cover from page 1 plus ${interiors.length} interior page${
        interiors.length === 1 ? "" : "s"
      }. Optimize them, then build the Talisbook™.`,
    );
  }

  async function extractPinnedPdf() {
    setError(null);
    resetBookAssets();
    setPhase("extracting");
    setStage("Loading pinned Talispros eBook pages…");
    try {
      const pageFiles = await loadPinnedTalisBookPageFiles({
        onProgress: (done, total) => {
          setStage(`Extracting pages: ${done} of ${total}…`);
        },
      });
      await applyWrapCoverFromFiles(pageFiles, "pinned");
    } catch (caught) {
      resetBookAssets();
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

  async function handleBookFilesSelected(files: File[]) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    setError(null);
    resetBookAssets();
    setPhase("converting");
    setStage("Reading upload…");
    try {
      await applyWrapCoverFromFiles(files, "upload");
    } catch (caught) {
      resetBookAssets();
      setError(
        caught instanceof Error
          ? caught.message
          : COVER_WRAP_PDF_NOT_LANDSCAPE_MESSAGE,
      );
      setStage("");
    } finally {
      setPhase("idle");
    }
  }

  async function optimizePages() {
    if (pages.length === 0 || !coverFiles) {
      setError("Extract the pinned PDF or upload a PDF first.");
      return;
    }
    setError(null);
    setPhase("optimizing");
    try {
      setStage("Optimizing wrap cover…");
      const [frontCover, backCover] = await Promise.all([
        uploadOptimizedPage({
          mapsiteId,
          file: coverFiles.front,
          index: 0,
        }),
        uploadOptimizedPage({
          mapsiteId,
          file: coverFiles.back,
          index: 0,
        }),
      ]);
      setOptimizedCovers({ front: frontCover, back: backCover });

      let usedPinnedFallback = false;
      let uploadError: string | null = null;
      const pinnedInteriorFallbacks =
        pageSource === "pinned"
          ? fallbackOptimizedDemoInteriorPagesAfterWrap()
          : [];
      const uploaded = await mapPool(pages, UPLOAD_CONCURRENCY, async (file, index) => {
        setStage(`Optimizing page ${index + 1} of ${pages.length}…`);
        try {
          return await uploadOptimizedPage({ mapsiteId, file, index });
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
          return fallback;
        }
      });
      setOptimized(uploaded);
      setStage(
        usedPinnedFallback
          ? `${uploaded.length} interiors ready using pinned assets. ${uploadError || "upload-image was unavailable."} You can still Build.`
          : `Wrap cover and ${uploaded.length} pages optimized and ready to build.`,
      );
    } catch (caught) {
      setOptimized([]);
      setOptimizedCovers(null);
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
    if (optimized.length === 0 || !optimizedCovers) {
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
          frontCover: optimizedCovers.front,
          backCover: optimizedCovers.back,
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
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-neutral-950 transition hover:bg-[#dcdce2] disabled:opacity-40"
            >
              {phase === "converting" ? "Reading upload…" : "Upload PDF"}
            </button>
            <p className="text-center text-[12px] leading-relaxed text-neutral-400">
              {EBOOK_GENERATE_COVER_PDF_HELP} {EBOOK_GENERATE_UPLOAD_HINT}
            </p>
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

            {pages.length > 0 && coverFiles ? (
              <p className="text-center text-[13px] text-neutral-500">
                Wrap cover from page 1 plus {pages.length} interior
                {pages.length === 1 ? "" : "s"}, ready to optimize.
              </p>
            ) : null}

            {pages.length > 0 && coverFiles ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void optimizePages()}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#e8e8ed] text-[15px] font-medium text-neutral-950 transition hover:bg-[#dcdce2] disabled:opacity-40"
              >
                {phase === "optimizing" ? "Optimizing pages…" : "Optimize pages"}
              </button>
            ) : null}

            {optimized.length > 0 && optimizedCovers ? (
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
