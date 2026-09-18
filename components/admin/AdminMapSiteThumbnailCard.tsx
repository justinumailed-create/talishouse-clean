"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { deleteAdminActiveMapSite } from "@/lib/mapsite-admin-service";
import type { AdminMapSiteThumbnail } from "@/lib/talispros/mapsite-admin-thumbnail";

function PreviewImage({
  src,
  fallback,
  className,
}: {
  src: string | null;
  fallback: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? fallback : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminMapSiteThumbnailCard({
  mapsite,
}: {
  mapsite: AdminMapSiteThumbnail;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const title =
    mapsite.propertyTitle?.trim() ||
    mapsite.propertyAddress?.trim() ||
    "Untitled Mapsite™";
  const caption = mapsite.propertyAddress?.trim() || title;

  function handleDelete() {
    const code = mapsite.fastCode;
    if (
      !confirm(
        `Delete Mapsite™ ${code}? Its Talisbooks™ bookshelf will also be removed. This cannot be undone.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAdminActiveMapSite(code, mapsite.id);
      if (!result.success) {
        alert(result.error || "Could not delete this Mapsite™.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <li>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
        <Link
          href={`/admin/mapsites/${mapsite.fastCode}`}
          className="group block"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200">
            <PreviewImage
              src={mapsite.mapPreviewUrl}
              fallback={mapsite.listingHeroUrl}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div
              className="pointer-events-none absolute left-1/2 top-[62%] z-10 -translate-x-1/2 -translate-y-full"
              aria-hidden
            >
              <span className="relative block h-7 w-5">
                <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-[#1A73E8] ring-2 ring-white shadow-sm" />
                <span className="absolute left-1/2 top-3 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[8px] border-x-transparent border-t-[#1A73E8]" />
              </span>
            </div>

            <div className="absolute left-1/2 top-[11%] z-20 w-[46%] min-w-[9.5rem] max-w-[13.5rem] -translate-x-1/2 overflow-hidden rounded-xl bg-white/80 shadow-[0_10px_28px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
              <div className="relative aspect-video bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapsite.listingHeroUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
                />
              </div>
              <div className="bg-gradient-to-b from-white/70 to-white/85 px-2.5 pb-2 pt-1.5">
                <p className="m-0 truncate text-[11px] font-semibold leading-tight text-black">
                  {title}
                </p>
                <p className="m-0 text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                  FAST Code: {mapsite.fastCode}
                </p>
              </div>
            </div>

            <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1">
              {mapsite.deleteControl === "lock" ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm"
                  title="Paid Mapsite™ — delete protected"
                >
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Paid
                </span>
              ) : null}
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500 backdrop-blur-sm">
                {mapsite.status}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-start justify-between gap-3 px-3.5 py-3">
          <Link
            href={`/admin/mapsites/${mapsite.fastCode}`}
            className="min-w-0 flex-1"
          >
            <p className="font-mono text-sm font-medium text-neutral-900">
              {mapsite.fastCode}
            </p>
            <p className="truncate text-sm text-neutral-500">{caption}</p>
          </Link>
          <div className="mt-0.5 flex shrink-0 items-center gap-3">
            {mapsite.deleteControl === "delete" ? (
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            ) : null}
            {mapsite.deleteControl === "lock" ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600"
                title="Paid Mapsite™ — delete protected"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            ) : null}
            <Link
              href={`/admin/mapsites/${mapsite.fastCode}`}
              className="text-xs text-neutral-400 transition hover:text-neutral-700"
            >
              Open
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
