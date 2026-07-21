import Link from "next/link";
import Image from "next/image";
import TalisprosMarketsDropdown from "@/components/talispros/TalisprosMarketsDropdown";
import TalisprosStartSidebar from "@/components/talispros/TalisprosStartSidebar";
import { TALISPROS_START_INTRO, TALISPROS_START_SLOGAN } from "@/lib/talispros/start-content";

export default function TalisprosStartPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white text-neutral-900 lg:grid lg:grid-cols-[minmax(0,1fr)_350px]">
      {/* Left column */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className="flex-shrink-0 border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-center gap-8">
            <Link
              href="/talispros/start"
              className="text-[11px] tracking-[0.08em] text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Welcome
            </Link>
            <TalisprosMarketsDropdown />
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <header className="border-b border-neutral-200 px-6 text-center">
            <p className="mx-auto max-w-xs pt-8 text-[15px] leading-6 tracking-[0.06em] text-neutral-400 sm:pt-10">
              {TALISPROS_START_SLOGAN}
            </p>
            <Image
              src="/logo.png"
              alt="TalisPros PMC"
              width={48}
              height={48}
              className="mx-auto my-5 h-12 w-12 object-contain"
              priority
            />
            <h1 className="pb-6 text-[34px] leading-[1.15] tracking-[0.12em] text-neutral-900 sm:text-[53px] sm:leading-[70px]">
              Talispros PMC
            </h1>
          </header>

          <section className="px-4 pb-10 pt-4 sm:px-6">
            <div className="mx-auto w-full max-w-[1200px]">
              <Image
                src="/images/glasshouse/glasshouse.png"
                alt="Glasshouse™ cabin in the forest"
                width={1200}
                height={668}
                priority
                className="mx-auto block h-auto w-full max-w-full"
                sizes="(min-width: 1200px) 1200px, calc(100vw - 350px)"
              />
            </div>
          </section>

          <section className="px-6 pb-16 text-center">
            <p className="mx-auto max-w-3xl text-xs leading-relaxed text-neutral-900 sm:text-sm">
              {TALISPROS_START_INTRO}
            </p>
          </section>
        </div>
      </div>

      <TalisprosStartSidebar />
    </div>
  );
}
