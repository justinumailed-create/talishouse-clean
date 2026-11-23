import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import WebsterBook from "@/components/talispros/webster-book/WebsterBook";
import { poppins } from "@/lib/fonts";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/income-units");
}

/**
 * "Income Units, Proposal by Webster": the web book behind the Talishouse™
 * (Windswept) PIN on the Mapsites map (Ralf, Nov 23). The Catalogue is the
 * next step, through the "See the Catalogue" button.
 */
export default function IncomeUnitsPage() {
  return (
    <div className={`${poppins.className} flex min-h-dvh flex-col bg-[#0f1318] font-sans text-white`}>
      <TalisUMktsHeader />
      <WebsterBook />
    </div>
  );
}
