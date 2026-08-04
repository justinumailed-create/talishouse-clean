import Image from "next/image";
import type { TalisprosMarketPageContent } from "@/lib/talispros/market-pages";

interface TalisprosMarketSidebarProps {
  content: TalisprosMarketPageContent;
}

export default function TalisprosMarketSidebar({ content }: TalisprosMarketSidebarProps) {
  const managerName = content.marketPartner
    .replace(/^Market Partner:\s*/i, "")
    .trim();

  return (
    <aside className="flex-none bg-[#f2f2f0] text-black lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-[#dedede] lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
      <div className="px-5 pb-10 pt-8 text-center sm:px-6 sm:pt-10">
        <h2 className="text-[21px] leading-snug text-black">
          Your Mapsite™ Manager:
          <br />
          {managerName}
        </h2>

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

        <h3 className="mt-8 text-[26px] leading-snug text-black">
          What is my role in your business?
        </h3>

        <p className="mx-auto mt-5 max-w-[18rem] text-left text-[14px] leading-[26px] text-black sm:text-center">
          I help grow your real estate adjacent marketing along the following
          broad development curves:
          <br />
          <br />
          TEB: I manage your bookshelf to highlight qualifying listings by
          promoting digital publications. Qualifying listings are those that pay
          enough and have enough term to improve performance metrics on both
          levels over time. This pays for me many times over.
          <br />
          <br />
          TVA: I analyze listings that may be suitable for an investor class that
          seeks collective purchases, or even tokenization. Such purchase options
          are often incompatible with exposure on industry platforms. Hence, I
          manage your Mapsite™ initiatives.
          <br />
          <br />
          TTV: I coordinate video production and in-house online TV programming
          at a fraction of the cost of conventional channels, including
          green-screen production of features that influence word-of-mouth and
          highlight core competencies.
          <br />
          <br />
          Please add me to your team...!
          <br />
          Rahul
        </p>
      </div>
    </aside>
  );
}
