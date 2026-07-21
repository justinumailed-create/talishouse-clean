import type { Metadata } from "next";
import TalisprosMarketRegistrationForm from "@/components/talispros/TalisprosMarketRegistrationForm";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { createMetadata } from "@/lib/seo";
import { FOR_SALE_BY_OWNERS_MARKET } from "@/lib/talispros/market-pages";

export const metadata: Metadata = createMetadata({
  title: FOR_SALE_BY_OWNERS_MARKET.metadataTitle,
  description: FOR_SALE_BY_OWNERS_MARKET.whyBody,
  path: `/talispros/markets/${FOR_SALE_BY_OWNERS_MARKET.slug}`,
});

export default function ForSaleByOwnersMarketPage() {
  return (
    <TalisprosMarketPageLayout content={FOR_SALE_BY_OWNERS_MARKET}>
      <TalisprosMarketRegistrationForm
        market={FOR_SALE_BY_OWNERS_MARKET.registrationMarket}
      />
    </TalisprosMarketPageLayout>
  );
}
