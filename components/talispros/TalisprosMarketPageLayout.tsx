import type { ReactNode } from "react";
import type { TalisprosMarketPageContent } from "@/lib/talispros/market-pages";
import TalisprosMarketNav from "@/components/talispros/TalisprosMarketNav";
import TalisprosMarketSidebar from "@/components/talispros/TalisprosMarketSidebar";

interface TalisprosMarketPageLayoutProps {
  content: TalisprosMarketPageContent;
  children: ReactNode;
}

export default function TalisprosMarketPageLayout({
  content,
  children,
}: TalisprosMarketPageLayoutProps) {
  return (
    <div className="flex min-h-dvh min-h-0 flex-col overflow-hidden bg-white text-neutral-900 lg:h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_350px]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TalisprosMarketNav />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <header className="border-b border-neutral-200 px-4 py-7 text-center sm:px-6 sm:py-10">
            <h1 className="text-[30px] leading-[1.15] tracking-[0.1em] text-neutral-900 sm:text-[53px] sm:leading-[70px]">
              {content.title}
            </h1>
          </header>

          <section className="py-8 sm:py-10">{children}</section>
        </div>
      </div>

      <TalisprosMarketSidebar content={content} />
    </div>
  );
}
