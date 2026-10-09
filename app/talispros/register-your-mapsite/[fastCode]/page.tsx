import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  MAPSITE_DEFAULT_REGISTER_URL,
  MAPSITE_URL_GATE_HEADLINE,
  mapsiteListingUrlOverride,
} from "@/lib/talispros/mapsite-url-gate";

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
      "Register for this Mapsite — visitors go straight to Register (no FAST Code™ dead-end gate).",
    path: `/talispros/register-your-mapsite/${encodeURIComponent(fastCode)}`,
  });
}

/**
 * Legacy URL-gate path. Claimed Mapsite URL buttons no longer land here; if
 * someone still hits this route, send them to Aisha's Register page
 * (/talisu/reg, same tab — server redirect) instead of the broken FAST Code™ /
 * secure-code gate or a bare SamCart checkout. Checkout itself still happens
 * on /talisu/reg (embedded SamCart register).
 */
export default async function RegisterYourMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;
  const mapsite = await getMapSiteByFastCode(fastCode);
  if (!mapsite) {
    notFound();
  }

  redirect(
    mapsiteListingUrlOverride(mapsite.fastCode) ?? MAPSITE_DEFAULT_REGISTER_URL,
  );
}
