import Image from "next/image";
import TalisprosStartSidebar from "@/components/talispros/TalisprosStartSidebar";

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
                <div className="flex items-center gap-3 bg-white px-3 py-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:gap-4 sm:bg-black/50 sm:px-5 sm:py-3">
                  <div className="min-w-0 flex-1 text-center text-sm font-bold leading-snug tracking-[0.03em] text-neutral-900 sm:text-base sm:text-white">
                    Seen here, a Glasshouse™ optimized for short-term rental purposes. A
                    Mapsite™ of 50 miles around a centre point, or up to 100,000 people
                    population base, is automatically included with every Account.*
                  </div>
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-2 ring-neutral-900 sm:flex sm:h-14 sm:w-14 sm:ring-white">
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
