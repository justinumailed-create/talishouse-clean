import Image from "next/image";
import type { TalisprosMarketPageContent } from "@/lib/talispros/market-pages";

interface TalisprosMarketSidebarProps {
  content: TalisprosMarketPageContent;
}

export default function TalisprosMarketSidebar({ content }: TalisprosMarketSidebarProps) {
  return (
    <aside className="flex-none bg-[#f2f2f0] text-black lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-[#dedede] lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
      <div className="px-5 pb-10 pt-8 text-center sm:px-6 sm:pt-10">
        <h2 className="text-[26px] leading-snug text-black">{content.marketPartner}</h2>

        <div className="mx-auto mt-6 max-w-[280px]">
          <Image
            src={content.partnerImage}
            alt={content.partnerImageAlt}
            width={896}
            height={1200}
            className="mx-auto h-auto w-full"
            sizes="280px"
            priority
          />
        </div>

        <h3 className="mt-8 text-[26px] leading-snug text-black">{content.whyHeading}</h3>

        <p className="mx-auto mt-5 max-w-[18rem] text-left text-[12px] leading-[22px] text-black sm:text-center">
          {content.whyBody}
        </p>
      </div>
    </aside>
  );
}
