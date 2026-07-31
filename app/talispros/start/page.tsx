import Image from "next/image";
import TalisprosStartSidebar from "@/components/talispros/TalisprosStartSidebar";
import { TALISPROS_START_INTRO } from "@/lib/talispros/start-content";

export default function TalisprosStartPage() {
  return (
    <div className="flex min-h-dvh min-h-0 flex-col overflow-hidden bg-white text-neutral-900 lg:h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_350px]">
      {/* Left column */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <header className="border-b border-neutral-200 px-6 pt-4 text-center sm:pt-5">
            <Image
              src="/logo.png"
              alt="TalisPros PMC"
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
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-black/50 px-3 py-3 sm:gap-4 sm:px-5">
                  <div className="min-w-0 flex-1 text-center text-base font-bold leading-relaxed tracking-[0.03em] text-white sm:text-lg">
                    {TALISPROS_START_INTRO}
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-2 ring-white sm:h-14 sm:w-14">
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
                Seen: A Glasshouse™ Tiny Home available from $58.50 per sq.ft.
              </p>
            </div>
          </section>
        </div>
      </div>

      <TalisprosStartSidebar />
    </div>
  );
}
