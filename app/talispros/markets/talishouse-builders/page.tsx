import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { TALISHHOUSE_BUILDERS_MARKET } from "@/lib/talispros/market-pages";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/markets/talishouse-builders");
}

export default function TalishouseBuildersMarketPage() {
  return (
    <TalisprosMarketPageLayout content={TALISHHOUSE_BUILDERS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={TALISHHOUSE_BUILDERS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
