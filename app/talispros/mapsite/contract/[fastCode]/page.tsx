import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { notFound } from "next/navigation";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import MapSiteContractClient from "@/components/talispros/mapsite/contract/MapSiteContractClient";
import {
  loadMapSiteContractText,
  readUnlockedContractCodeId,
} from "../../contract-actions";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ fastCode: string }>;

export async function generateMetadata(): Promise<Metadata> {
  // Own EN/DE title, description and 1200×630 share card (scripts/og/pages_src.py).
  // Utility kind: private per-client page, noindex.
  return pageMetadata("/talispros/mapsite/contract/[fastCode]");
}

export default async function MapSiteContractPage({ params }: { params: RouteParams }) {
  const { fastCode: raw } = await params;
  const fastCode = raw.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,32}$/.test(fastCode)) notFound();
  const mapsite = await getMapSiteByFastCode(fastCode).catch(() => null);
  if (!mapsite) notFound();
  const unlocked = Boolean(await readUnlockedContractCodeId(fastCode));
  const contract = unlocked ? await loadMapSiteContractText(fastCode) : null;
  return (
    <div className="min-h-dvh bg-neutral-100">
      <TalisUMktsHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <MapSiteContractClient
          fastCode={fastCode}
          unlocked={unlocked}
          contractText={contract?.text ?? null}
          isPlaceholder={contract?.isPlaceholder ?? false}
          propertyAddress={mapsite.propertyAddress ?? null}
        />
      </main>
    </div>
  );
}
