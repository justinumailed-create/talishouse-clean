import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { FOR_SALE_BY_OWNERS_MARKET } from "@/lib/talispros/market-pages";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/markets/for-sale-by-owners");
}

export default function ForSaleByOwnersMarketPage() {
  return (
    <TalisprosMarketPageLayout content={FOR_SALE_BY_OWNERS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={FOR_SALE_BY_OWNERS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
