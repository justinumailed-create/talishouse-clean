import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { mapsiteShareOgPath } from "@/lib/share/og-card";
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
  return dynamicPageMetadata((locale) => ({
    title:
      locale === "de"
        ? "Für diese Mapsite registrieren | Tsplits™"
        : `${MAPSITE_URL_GATE_HEADLINE} | Tsplits™`,
    description:
      locale === "de"
        ? "Registrieren Sie sich für diese Mapsite und arbeiten Sie mit dem Team von Aisha C."
        : "Register for this Mapsite and work with Aisha C.'s team.",
    path: `/talispros/register-your-mapsite/${encodeURIComponent(fastCode)}`,
    image: mapsiteShareOgPath(fastCode),
  }));
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
