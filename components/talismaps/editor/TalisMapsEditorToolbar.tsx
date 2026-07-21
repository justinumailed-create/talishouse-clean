"use client";

import Link from "next/link";
import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";
import { TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

export default function TalisMapsEditorToolbar() {
  const { map, saveState } = usePinEngine();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={TALISMAPS_ROUTES.HOME}
          className="truncate text-sm font-semibold text-neutral-900"
        >
          {TALISMAPS_PRODUCT_NAME}
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="truncate text-sm text-neutral-500">{map?.name ?? "Untitled Map"}</span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium capitalize text-neutral-600">
          {saveState}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-400"
        >
          Preview
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white opacity-50"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
