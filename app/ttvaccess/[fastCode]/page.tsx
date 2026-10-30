import { dynamicPageMetadata } from "@/lib/seo/page-metadata";
import { mapsiteShareOgPath } from "@/lib/share/og-card";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode?: string }>;
}) {
  const code = ((await params)?.fastCode ?? "").toUpperCase().trim();
  return dynamicPageMetadata((locale) => ({
    title: locale === "de" ? `TalisTV™ Zugang ${code} | Tsplits™` : `TalisTV™ Access ${code} | Tsplits™`,
    description: locale === "de" ? `TalisTV™ auf der Tsplits™ Mapsite zum FAST Code ${code} ansehen.` : `Watch TalisTV™ on the Tsplits™ Mapsite for FAST Code ${code}.`,
    path: `/ttvaccess/${encodeURIComponent(code)}`,
    image: mapsiteShareOgPath(code || "allpins"),
  }));
}

export default async function TTVAccessPage({ params }: { params: Promise<{ fastCode?: string }> }) {
  const resolvedParams = await params;
  const fastCode = resolvedParams?.fastCode?.toUpperCase().trim();

  if (!fastCode || fastCode === "UNDEFINED") {
    redirect("/partner-access");
  }

  // TalisTV™ access now lives on the published Mapsite for this FAST Code.
  redirect(`/mapsite/${encodeURIComponent(fastCode.toLowerCase())}`);
}
