import RahulBuildAssistClient from "@/components/talispros/RahulBuildAssistClient";
import TalisprosMarketPageLayout from "@/components/talispros/TalisprosMarketPageLayout";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { CLAIM_A_MARKET_PAGE } from "@/lib/talispros/market-pages";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssistedBuildMapSitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audienceParam =
    firstParam(params.audience)?.trim().toLowerCase() || "listings";
  const audience = parseRegistrationMarket(audienceParam) ?? "listings";

  const content = {
    ...CLAIM_A_MARKET_PAGE,
    title: "Have Me Build It",
    registrationMarket: audience,
  };

  return (
    <TalisprosMarketPageLayout content={content}>
      <RahulBuildAssistClient initialAudienceType={audienceParam} />
    </TalisprosMarketPageLayout>
  );
}
