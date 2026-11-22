import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import HomeMarketPage from "@/components/talispros/home-market/HomeMarketPage";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { homeMarketById } from "@/lib/talisu/north-america-markets";

export async function generateMetadata() {
  return pageMetadata("/home-market");
}

export const dynamic = "force-dynamic";

/**
 * Public Home Market page, opened by the homepage "Build Mapsite" button
 * (Ralf, Nov 21 and 22). No sign-in, no admin gate, nothing saved here.
 */
export default async function HomeMarketRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.market) ? params.market[0] : params.market;
  const initialMarketId = homeMarketById(raw)?.id ?? null;
  return (
    <div className="flex min-h-dvh flex-col bg-white lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <TalisUMktsHeader />
      <HomeMarketPage initialMarketId={initialMarketId} />
    </div>
  );
}
