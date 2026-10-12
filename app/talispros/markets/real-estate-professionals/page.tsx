import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { REAL_ESTATE_PROFESSIONALS_MARKET } from "@/lib/talispros/market-pages";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/markets/real-estate-professionals");
}

export default function RealEstateProfessionalsMarketPage() {
  return (
    <TalisprosMarketPageLayout content={REAL_ESTATE_PROFESSIONALS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={REAL_ESTATE_PROFESSIONALS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
