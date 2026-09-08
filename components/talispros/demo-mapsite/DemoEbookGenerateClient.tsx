"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertPdfFileToImageFiles } from "@/lib/talisbooks/pdf-pages-to-images";
import { generateDemoEbookAction } from "@/app/talispros/demo-mapsite/actions";
import {
  PINNED_TALISBOOK_PDF_FILE_NAME,
  PINNED_TALISBOOK_PDF_PATH,
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

type OptimizedAsset = {
  url: string;
  width: number;
  height: number;
};

const UPLOAD_CONCURRENCY = 2;

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

  async function extractPinnedPdf() {
    setError(null);
    setBusy(true);
    setStage("Fetching pinned Talispros eBook PDF…");
    try {
      const response = await fetch(PINNED_TALISBOOK_PDF_PATH);
      if (!response.ok) {
        throw new Error("Could not load the pinned Talispros eBook PDF.");
      }
      const blob = await response.blob();
      const file = new File([blob], PINNED_TALISBOOK_PDF_FILE_NAME, {
        type: "application/pdf",
      });
      const pageFiles = await convertPdfFileToImageFiles(file, {
        onProgress: (done, total) => {
          setStage(`Extracting pages: ${done} of ${total}…`);
        },
      });
      if (pageFiles.length === 0) {
        throw new Error("No pages were extracted from the pinned PDF.");
      }
      setPages(pageFiles);
      setStage(`${pageFiles.length} pages extracted from the pinned PDF.`);
    } catch (caught) {
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

  async function optimizeAndGenerate() {
    if (pages.length === 0) {
      setError("Extract the pinned PDF first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const optimized = await mapPool(pages, UPLOAD_CONCURRENCY, async (file, index) => {
        setStage(`Optimizing page ${index + 1} of ${pages.length}…`);
        const fd = new FormData();
        fd.set("mapsiteId", mapsiteId);
        fd.set("kind", "property");
        fd.set("label", file.name || `page-${index + 1}.jpg`);
        fd.set("file", file, file.name || `page-${index + 1}.jpg`);
        const response = await fetch("/api/talispros/ebook-generate/upload-image", {
          method: "POST",
          body: fd,
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          url?: string;
          width?: number;
          height?: number;
        };
        if (!response.ok || !payload.ok || !payload.url) {
          throw new Error(
            payload.error || `Failed to optimize page ${index + 1}.`,
          );
        }
        return {
          url: payload.url,
          width: Number(payload.width) || 1,
          height: Number(payload.height) || 1,
        } satisfies OptimizedAsset;
      });

      setStage("Building demonstration Talisbook™…");
      const result = await generateDemoEbookAction({
        mapsiteId,
        optimizedImages: optimized,
      });
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
        {busy && pages.length === 0
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
          onClick={() => void optimizeAndGenerate()}
          className="w-full rounded-2xl border border-neutral-900 px-5 py-3.5 text-base font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {busy && pages.length > 0
            ? "Optimizing and generating…"
            : "Optimize pages and generate Talisbook™"}
        </button>
      ) : null}

      {stage ? <p className="text-sm text-neutral-500">{stage}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-center text-xs text-neutral-500">
        Same extract → rasterize → optimize path as live generation, using the
        pinned sample PDF.{" "}
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
