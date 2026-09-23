import Image from "next/image";
import TalisprosLegalCopy from "@/components/talispros/TalisprosLegalCopy";
import TalisprosHomeMapPreview from "@/components/talispros/TalisprosHomeMapPreview";
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
                <TalisprosHomeMapPreview />
              </div>
              <TalisprosLegalCopy
                className="mx-auto max-w-[42rem] pt-4 text-center"
                primaryClassName="text-sm font-medium leading-snug text-neutral-900 sm:text-base"
                secondaryClassName="mt-2 text-sm font-medium text-neutral-900 sm:text-base"
              />
            </div>
          </section>
        </div>
      </div>

      <TalisprosStartSidebar />
    </div>
  );
}
