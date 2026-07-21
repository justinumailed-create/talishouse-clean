import type { Metadata } from "next";
import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { createMetadata } from "@/lib/seo";
import { REAL_ESTATE_PROFESSIONALS_MARKET } from "@/lib/talispros/market-pages";

export const metadata: Metadata = createMetadata({
  title: REAL_ESTATE_PROFESSIONALS_MARKET.metadataTitle,
  description: REAL_ESTATE_PROFESSIONALS_MARKET.whyBody,
  path: `/talispros/markets/${REAL_ESTATE_PROFESSIONALS_MARKET.slug}`,
});

export default function RealEstateProfessionalsMarketPage() {
  return (
    <TalisprosMarketPageLayout content={REAL_ESTATE_PROFESSIONALS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={REAL_ESTATE_PROFESSIONALS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
