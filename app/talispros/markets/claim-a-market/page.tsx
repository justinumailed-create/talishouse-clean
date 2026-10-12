import { parseRegistrationMarket } from "@/lib/registration-market";
import { CLAIM_A_MARKET_PAGE } from "@/lib/talispros/market-pages";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import ClaimMarketRegistrationClient from "@/components/talispros/ClaimMarketRegistrationClient";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/markets/claim-a-market");
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ClaimAMarketPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audience =
    parseRegistrationMarket(firstParam(params.audience)) ??
    CLAIM_A_MARKET_PAGE.registrationMarket;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || undefined;
  const returnTo = firstParam(params.returnTo) || MAPSITE_APP_PATH;

  const content = {
    ...CLAIM_A_MARKET_PAGE,
    registrationMarket: audience,
  };

  return (
    <TalisprosMarketPageLayout content={content}>
      <ClaimMarketRegistrationClient
        market={audience}
        mapsiteId={mapsiteId}
        returnTo={returnTo}
      />
    </TalisprosMarketPageLayout>
  );
}
