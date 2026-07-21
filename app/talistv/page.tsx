import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { TALISTV_VIDEO_SHELF_PROFILE } from "@/lib/talispros/shelf-framework";

export default function TalisTvPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Talispros™ Ecosystem
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
        TalisTV™ (TTV) Video Shelf
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-600">
        Layout framework is prepared with shelf economics and capacity modeling for a premium
        video product line.
      </p>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Planned Shelf Model
        </h2>
        <p className="mt-2 text-lg font-semibold text-neutral-900">
          {TALISTV_VIDEO_SHELF_PROFILE.capacity} {TALISTV_VIDEO_SHELF_PROFILE.unitLabel} · $
          {TALISTV_VIDEO_SHELF_PROFILE.monthlyCapacityUsd.toFixed(2)}/mo capacity
        </p>
      </section>

      <Link
        href={ROUTES.TALISBOOKS_LIBRARY}
        className="mt-8 inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Back to TalisBooks Library
      </Link>
    </main>
  );
}
