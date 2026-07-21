"use client";

import { useState, useTransition } from "react";
import type { TalisBooksCenterfoldPreview } from "@/lib/talisbooks/image-engine";

interface TalisBooksCenterfoldPreviewCardProps {
  preview: TalisBooksCenterfoldPreview;
  onReview?: (
    originalImageId: string,
    status: "approved" | "rejected",
  ) => Promise<void>;
}

export default function TalisBooksCenterfoldPreviewCard({
  preview,
  onReview,
}: TalisBooksCenterfoldPreviewCardProps) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(preview.reviewStatus);

  const handleReview = (next: "approved" | "rejected") => {
    if (!preview.originalImageId || !onReview) {
      return;
    }
    startTransition(async () => {
      await onReview(preview.originalImageId!, next);
      setStatus(next);
    });
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{preview.originalName}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {preview.originalWidth}×{preview.originalHeight} · {preview.orientation} · original
            preserved
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            status === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : status === "rejected"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Original (unchanged)
          </p>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            {preview.originalUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.originalUrl}
                alt={preview.originalName}
                className="h-auto w-full object-contain"
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
                Original preview unavailable
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Derived centerfold · left + right
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["left", "right"] as const).map((side) => {
              const page = preview[side];
              return (
                <div
                  key={side}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <p className="border-b border-neutral-100 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {side} page · {page.width}×{page.height}
                  </p>
                  {page.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={page.url} alt={page.name} className="h-auto w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center text-xs text-neutral-400">
                      Derived {side}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
            <div className="rounded-lg bg-neutral-50 px-3 py-2">
              <dt className="text-neutral-400">Seam aligned</dt>
              <dd className="font-medium text-neutral-900">
                {preview.alignment.seamAligned ? "Yes" : "No"}
              </dd>
            </div>
            <div className="rounded-lg bg-neutral-50 px-3 py-2">
              <dt className="text-neutral-400">Height matched</dt>
              <dd className="font-medium text-neutral-900">
                {preview.alignment.heightMatched ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {onReview && status === "pending_preview" && (
        <div className="flex flex-wrap gap-3 border-t border-neutral-100 px-5 py-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => handleReview("approved")}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            Approve for publish
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleReview("rejected")}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
