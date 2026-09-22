import Image from "next/image";
import MarketingPartnerInterestLinks from "@/components/talispros/mapsite/MarketingPartnerInterestLinks";
import {
  MAPSITE_MARKET_PARTNER_FALLBACK_NAME,
  MARKETING_PARTNER_ROLE_LABEL,
  type TalisprosMarketPageContent,
} from "@/lib/talispros/market-pages";

interface TalisprosMarketSidebarProps {
  content: TalisprosMarketPageContent;
}

export default function TalisprosMarketSidebar({ content }: TalisprosMarketSidebarProps) {
  return (
    <aside className="flex-none bg-[#f2f2f0] text-black lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-[#dedede] lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
      <div className="px-5 pb-10 pt-8 text-center sm:px-6 sm:pt-10">
        <h2 className="text-[21px] leading-snug text-black">
          {MARKETING_PARTNER_ROLE_LABEL}
          <br />
          {MAPSITE_MARKET_PARTNER_FALLBACK_NAME}
        </h2>

        <div className="mx-auto mt-6 max-w-[280px]">
          <Image
            src={content.partnerImage}
            alt={MAPSITE_MARKET_PARTNER_FALLBACK_NAME}
            width={896}
            height={1200}
            className="mx-auto h-auto w-full"
            sizes="280px"
            priority
          />
        </div>

        <MarketingPartnerInterestLinks className="mx-auto mt-6 max-w-[18rem]" />
      </div>
    </aside>
  );
}
