import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { mapsiteBackFromScheduleHref } from "@/lib/mapsite-layout";
import {
  TALISTV_GUIDE_CHANNEL,
  TALISTV_GUIDE_SLOTS,
  TALISTV_LAUNCH_HEADLINE,
  TALISTV_LAUNCH_NOTICE,
  type TalisTvGuideShow,
} from "@/lib/talistv/guide-schedule";

export const dynamic = "force-dynamic";

function statusLabel(status: TalisTvGuideShow["status"]) {
  if (status === "live") return "Live";
  if (status === "up-next") return "Up next";
  return null;
}

interface TalisTvPageProps {
  searchParams: Promise<{
    fastCode?: string;
  }>;
}

export default async function TalisTvPage({ searchParams }: TalisTvPageProps) {
  const { fastCode } = await searchParams;
  const mapsiteHref = mapsiteBackFromScheduleHref(fastCode);

  return (
    <main className="min-h-dvh bg-[#f5f5f7] font-sans text-neutral-900">
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href={ROUTES.TALISTV} className="brand-lockup group flex items-center gap-3 no-underline">
            <Image
              src="/logo.png"
              alt={TALISTV_GUIDE_CHANNEL.name}
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
              priority
            />
            <span className="m-0 text-[15px] font-semibold leading-none tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600">
              {TALISTV_GUIDE_CHANNEL.name}
            </span>
          </Link>
          <Link
            href={mapsiteHref}
            className="inline-flex shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            Back to Mapsite™
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <section
          aria-label="TalisTV program guide"
          className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
        >
          <div
            className="pointer-events-none select-none opacity-35 grayscale"
            aria-hidden="true"
          >
            <div className="grid grid-cols-[5.5rem_1fr] border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 sm:grid-cols-[6.5rem_1fr]">
              <div className="border-r border-neutral-200 px-3 py-3 sm:px-4">
                Time
              </div>
              <div className="px-4 py-3">Program</div>
            </div>

            <ul className="divide-y divide-neutral-100">
              {TALISTV_GUIDE_SLOTS.map((slot) => {
                const badge = statusLabel(slot.show.status);
                const isLive = slot.show.status === "live";

                return (
                  <li
                    key={slot.id}
                    className={[
                      "grid grid-cols-[5.5rem_1fr] sm:grid-cols-[6.5rem_1fr]",
                      isLive ? "bg-sky-50" : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex items-start border-r border-neutral-100 px-3 py-4 font-mono text-sm tabular-nums sm:px-4",
                        isLive ? "text-sky-700" : "text-neutral-500",
                      ].join(" ")}
                    >
                      <span className="pt-0.5">{slot.timeLabel}</span>
                    </div>

                    <div className="flex min-w-0 items-start justify-between gap-3 px-4 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            className={[
                              "truncate text-[15px] font-semibold",
                              isLive ? "text-sky-900" : "text-neutral-900",
                            ].join(" ")}
                          >
                            {slot.show.title}
                          </h2>
                          {badge ? (
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                isLive
                                  ? "bg-red-500 text-white"
                                  : "bg-neutral-100 text-neutral-600",
                              ].join(" ")}
                            >
                              {badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-neutral-500">
                          {slot.show.subtitle}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                          {slot.show.category}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {slot.show.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 py-8 sm:px-10">
            <div className="max-w-4xl rounded-[28px] bg-white/90 px-6 py-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] backdrop-blur-md sm:px-12 sm:py-12">
              <p className="text-[1.65rem] font-bold uppercase tracking-[0.04em] text-neutral-900 sm:text-5xl sm:leading-[1.05] lg:text-[3.25rem]">
                {TALISTV_LAUNCH_HEADLINE}
              </p>
              <p className="mt-4 text-[1.15rem] font-semibold leading-[1.25] tracking-[-0.02em] text-neutral-800 sm:mt-6 sm:text-3xl sm:leading-[1.2] lg:text-[2.15rem]">
                {TALISTV_LAUNCH_NOTICE}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={mapsiteHref}
            className="inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            Back to Mapsite™
          </Link>
          <Link
            href={
              fastCode?.trim()
                ? `${ROUTES.TALISBOOKS_LIBRARY}?from=${encodeURIComponent(fastCode.trim())}`
                : ROUTES.TALISBOOKS_LIBRARY
            }
            className="inline-flex rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Talisbooks™ Library
          </Link>
        </div>
      </div>
    </main>
  );
}
