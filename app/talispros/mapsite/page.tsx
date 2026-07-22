import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { loadMapSiteApplicationState } from "./actions";
import MapSiteApplication from "@/components/talispros/mapsite/MapSiteApplication";

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

export default async function TalisprosMapSitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const audience = parseRegistrationMarket(firstParam(params.audience)) ?? "listings";
  const claimed =
    firstParam(params.claimed) === "1" ||
    firstParam(params.claimed)?.toLowerCase() === "true";
  const mapsite = await loadMapSiteApplicationState({
    mapsiteId: firstParam(params.mapsiteId),
    fastCode: firstParam(params.fastCode),
    requestId: firstParam(params.requestId),
    claimed,
  });

  return (
    <MapSiteApplication
      initialMapSite={mapsite}
      audience={audience}
      openPinOnLoad
    />
  );
}
