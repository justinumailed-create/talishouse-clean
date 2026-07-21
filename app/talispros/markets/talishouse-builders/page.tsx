import type { Metadata } from "next";
import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { createMetadata } from "@/lib/seo";
import { TALISHHOUSE_BUILDERS_MARKET } from "@/lib/talispros/market-pages";

export const metadata: Metadata = createMetadata({
  title: TALISHHOUSE_BUILDERS_MARKET.metadataTitle,
  description: TALISHHOUSE_BUILDERS_MARKET.whyBody,
  path: `/talispros/markets/${TALISHHOUSE_BUILDERS_MARKET.slug}`,
});

export default function TalishouseBuildersMarketPage() {
  return (
    <TalisprosMarketPageLayout content={TALISHHOUSE_BUILDERS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={TALISHHOUSE_BUILDERS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
