import Image from "next/image";
import Link from "next/link";
import TalisprosStartSidebar from "@/components/talispros/TalisprosStartSidebar";
import {
  PINNED_TALISBOOK_ASSET_ROOT,
  PINNED_TALISBOOK_SLUG,
} from "@/lib/talisbooks/library/pinned-catalog";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

const PINNED_VIEWER_HREF = `${TALISBOOKS_ROUTES.VIEWER}/${PINNED_TALISBOOK_SLUG}`;

export default function TalisprosStartPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 lg:h-dvh lg:min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr)_350px] lg:overflow-hidden">
      {/* Left column */}
      <div className="flex flex-none flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
          <header className="border-b border-neutral-200 px-6 pt-4 text-center sm:pt-5">
            <Image
              src="/logo.png"
              alt="Talispros™ PMC"
              width={40}
              height={40}
              className="mx-auto mb-2 h-9 w-9 object-contain sm:mb-3 sm:h-10 sm:w-10"
              priority
            />
            <h1 className="pb-3 text-[28px] leading-[1.15] tracking-[0.12em] text-neutral-900 sm:pb-4 sm:text-[40px] sm:leading-[1.2]">
              Talispros
            </h1>
          </header>

          <section className="px-4 pb-8 pt-3 sm:px-6">
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="relative">
                <Image
                  src="/images/glasshouse/glasshouse.png"
                  alt="Glasshouse™ cabin in the forest"
                  width={1200}
                  height={668}
                  priority
                  className="mx-auto block h-auto w-full max-w-full"
                  sizes="(min-width: 1200px) 1200px, calc(100vw - 350px)"
                />
                <div className="relative flex items-center bg-white px-3 py-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-black/50 sm:px-5 sm:py-3">
                  <Link
                    href={PINNED_VIEWER_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:left-5"
                    aria-label="Open pinned Talisbook™ sample in a new tab"
                    title="Open sample Talisbook™"
                  >
                    <span className="relative block h-14 w-[2.65rem] shrink-0 overflow-hidden rounded-[2px] shadow-[2px_3px_10px_rgba(0,0,0,0.35)] ring-1 ring-black/25 sm:h-16 sm:w-12">
                      <Image
                        src={`${PINNED_TALISBOOK_ASSET_ROOT}/front-cover.jpg`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/35 to-transparent"
                      />
                    </span>
                    <span className="hidden flex-col items-start gap-1 sm:inline-flex">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/90">
                        View
                        <br />
                        E-Book
                      </span>
                      <span className="rounded-sm bg-[#f5c518] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-neutral-900 shadow-sm">
                        Open
                      </span>
                    </span>
                  </Link>
                  <div className="w-full px-16 text-center text-[11px] font-bold leading-snug tracking-[0.03em] text-neutral-900 sm:px-28 sm:text-xs sm:text-white">
                    Seen here, a Glasshouse™ optimized for short-term rental purposes. A
                    Mapsite™ of 50 miles around a centre point, or up to 100,000 people
                    population base, is automatically included with every Account.*
                  </div>
                  <div className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-black ring-2 ring-neutral-900 sm:right-5 sm:flex sm:h-14 sm:w-14 sm:ring-white">
                    <Image
                      src="/logo.png"
                      alt="Talishouse™"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain invert"
                    />
                  </div>
                </div>
              </div>
              <p className="pt-4 text-center text-sm font-medium text-neutral-900 sm:text-base">
                * Some limitations apply. Please follow what best describes you to learn more.
              </p>
            </div>
          </section>
        </div>
      </div>

      <TalisprosStartSidebar />
    </div>
  );
}
