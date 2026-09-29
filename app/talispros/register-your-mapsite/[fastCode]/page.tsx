import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  isMapsiteUrlGateExempt,
  MAPSITE_URL_GATE_HEADLINE,
  resolveMapsiteListingUrl,
} from "@/lib/talispros/mapsite-url-gate";
import RegisterYourMapSiteClient from "@/components/talispros/RegisterYourMapSiteClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}): Promise<Metadata> {
  const { fastCode } = await params;
  return createMetadata({
    title: `${MAPSITE_URL_GATE_HEADLINE} | Talispros™`,
    description:
      "Generate a secure code for Admin Notifications, then enter it to open the listing/payment URL.",
    path: `/talispros/register-your-mapsite/${encodeURIComponent(fastCode)}`,
  });
}

export default async function RegisterYourMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;
  const mapsite = await getMapSiteByFastCode(fastCode);
  const listingUrl = mapsite
    ? resolveMapsiteListingUrl(mapsite.fastCode, mapsite.brokerUrl)
    : null;
  if (!mapsite || !listingUrl) {
    notFound();
  }

  // Exempt FAST codes (e.g. DC01) skip the secure-code gate entirely.
  if (isMapsiteUrlGateExempt(mapsite.fastCode)) {
    redirect(listingUrl);
  }

  return (
    <RegisterYourMapSiteClient
      fastCode={mapsite.fastCode}
      pinIssued={Boolean(mapsite.urlGatePinIssuedAt)}
    />
  );
}
