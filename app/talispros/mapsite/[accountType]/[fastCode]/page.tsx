import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import {
  parseRegistrationMarket,
  type RegistrationMarket,
} from "@/lib/registration-market";
import {
  mapsiteAccountTypeSegment,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";
import {
  loadMapSiteApplicationState,
  resolveMapSitePaymentPlanType,
  resolveMapSiteRequestId,
} from "../../actions";
import { hasCompletedMapSitePaypalPayment } from "@/lib/talispros/mapsite-payment";
import MapSiteApplication from "@/components/talispros/mapsite/MapSiteApplication";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ accountType: string; fastCode: string }>;

function audienceForAccountTypeSegment(segment: string): RegistrationMarket {
  const market = parseRegistrationMarket(segment);
  if (market) return market;
  if (segment === "root") return "brokers";
  if (segment === "derivative") return "listings";
  if (segment === "adpro") return "adpro";
  return "listings";
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { accountType, fastCode } = await params;
  const code = fastCode.trim().toUpperCase();
  return createMetadata({
    title: `MapSite™ ${code}`,
    description: `Talispros™ MapSite™ for FAST Code ${code}.`,
    path: `${MAPSITE_APP_PATH}/${mapsiteAccountTypeSegment(accountType)}/${fastCode.trim().toLowerCase()}`,
  });
}

/**
 * Short claimed MapSite URL:
 * /talispros/mapsite/{accountType}/{fastCode}
 * e.g. /talispros/mapsite/listings/lg01
 */
export default async function ClaimedMapSiteByAccountTypePage({
  params,
}: {
  params: RouteParams;
}) {
  const { accountType: rawAccountType, fastCode: rawFastCode } = await params;
  const accountType = mapsiteAccountTypeSegment(rawAccountType);
  const fastCode = rawFastCode?.trim() || "";

  if (!fastCode || fastCode.toLowerCase() === "demo") {
    notFound();
  }

  const audience = audienceForAccountTypeSegment(accountType);
  const requestId = await resolveMapSiteRequestId({ fastCode });

  const mapsite = await loadMapSiteApplicationState({
    fastCode,
    requestId,
    claimed: true,
  });

  const paymentPlanType = await resolveMapSitePaymentPlanType({
    requestId,
    fastCode,
    mapsiteId: mapsite.id,
  });

  const paymentReceived = await hasCompletedMapSitePaypalPayment({
    mapsiteId: mapsite.id,
    fastCode,
    requestId,
  });

  return (
    <MapSiteApplication
      initialMapSite={{
        ...mapsite,
        fast_code: mapsite.fast_code || fastCode.toUpperCase(),
      }}
      audience={audience}
      requestId={requestId}
      paymentPlanType={paymentPlanType}
      paymentReceived={paymentReceived}
      openPinOnLoad
    />
  );
}
