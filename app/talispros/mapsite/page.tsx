import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { getTalisprosAdminSession } from "@/lib/talispros-admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { listPmcRegionalPins } from "@/lib/talispros/pmc-pins-service";
import { loadMapSiteApplicationState, resolveMapSitePaymentPlanType } from "./actions";
import MapSiteApplication from "@/components/talispros/mapsite/MapSiteApplication";
import MapSitePmcApplication from "@/components/talispros/mapsite/MapSitePmcApplication";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Talispros™ MapSite™",
  description:
    "Claim your market on the Talispros™ MapSite™ — the fullscreen map application for FSBO, builders, and real estate professionals.",
  path: "/talispros/mapsite",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isTruthyParam(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export default async function TalisprosMapSitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audience =
    parseRegistrationMarket(firstParam(params.audience)) ?? "listings";
  const claimed = isTruthyParam(firstParam(params.claimed));
  const view = firstParam(params.view)?.trim().toLowerCase() ?? null;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || null;
  const fastCode = firstParam(params.fastCode)?.trim() || null;
  const requestId = firstParam(params.requestId)?.trim() || null;

  // PMC multi-pin is brokers browse only. Any claim / FAST-code / pin view
  // must use the single-pin MapSite (user pin + MLS/URL/TEB/TTV card).
  const showSinglePinMap =
    claimed ||
    view === "pin" ||
    Boolean(mapsiteId) ||
    Boolean(fastCode) ||
    Boolean(requestId);

  if (audience === "brokers" && !showSinglePinMap) {
    const [pins, adminSession, marketingManager] = await Promise.all([
      listPmcRegionalPins(),
      getTalisprosAdminSession(),
      isMarketingManagerAuthenticated(),
    ]);

    return (
      <MapSitePmcApplication
        pins={pins}
        audience={audience}
        canEdit={Boolean(adminSession) || marketingManager}
      />
    );
  }

  const mapsite = await loadMapSiteApplicationState({
    mapsiteId,
    fastCode,
    requestId,
    claimed: claimed || view === "pin" || Boolean(requestId),
  });

  const paymentPlanType = await resolveMapSitePaymentPlanType({
    requestId,
    mapsiteId: mapsite.id,
  });

  return (
    <MapSiteApplication
      initialMapSite={mapsite}
      audience={audience}
      requestId={requestId}
      paymentPlanType={paymentPlanType}
      openPinOnLoad
    />
  );
}
