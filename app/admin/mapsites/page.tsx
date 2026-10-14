import { getAdminSessionAccount, requireAdminPage } from "@/lib/admin-auth";
import { agentCanEditMapSite } from "@/lib/mapsite-edit-auth";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";
import AdminMapSiteThumbnailCard from "@/components/admin/AdminMapSiteThumbnailCard";
import AdminMapSitePartnerLinksPanel from "@/components/admin/AdminMapSitePartnerLinksPanel";
import { canLinkMapSitePartners, listMapSitePartnerLinks } from "@/lib/talispros/mapsite-partner-links";
import AdminFreePinCreditsPanel from "@/components/admin/AdminFreePinCreditsPanel";
import { listFreePinGrants } from "@/lib/talispros/mapsite-additional-pins-service";
import { isSupabaseAdminConfigured, getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { purgeMapSitesAndBookshelvesWithoutFastCodes } from "@/lib/talispros/fast-code-cascade-delete";
import { contractAgentsByFastCode } from "@/lib/talispros/mapsite-contract-service";

export const dynamic = "force-dynamic";

export default async function AdminMapSitesPage() {
  await requireAdminPage();
  const account = await getAdminSessionAccount();
  const isAgent = account?.access === "agent";
  if (isSupabaseAdminConfigured() && !isAgent) {
    await purgeMapSitesAndBookshelvesWithoutFastCodes(getSupabaseAdmin());
  }
  const canLinkPartners = canLinkMapSitePartners(account);
  const [allMapSites, recentFreePinGrants, partnerLinks, contractAgents] = await Promise.all([
    listMapSitesForAdmin(),
    isAgent ? Promise.resolve([]) : listFreePinGrants({ limit: 20 }),
    canLinkPartners ? listMapSitePartnerLinks() : Promise.resolve([]),
    contractAgentsByFastCode(),
  ]);
  // Agent Admins only see the Mapsites they may edit.
  const mapsites = isAgent
    ? allMapSites.filter((mapsite) => agentCanEditMapSite(account, mapsite.fastCode))
    : allMapSites;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Mapsites</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Open a Mapsite to edit listing text, media, pin placement, lifecycle,
          and the custom ebook editor (Front Cover / Back Cover, interiors, publish).
        </p>
      </div>

      {canLinkPartners ? (
        <AdminMapSitePartnerLinksPanel
          initialLinks={partnerLinks}
          fastCodes={allMapSites.map((m) => m.fastCode).filter(Boolean)}
        />
      ) : null}

      {isAgent ? null : <AdminFreePinCreditsPanel initialGrants={recentFreePinGrants} />}

      {mapsites.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          No Mapsites found. New submissions appear here after a build request is generated.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mapsites.map((mapsite) => (
            <AdminMapSiteThumbnailCard
              key={mapsite.id || mapsite.fastCode}
              mapsite={mapsite}
              contractAgent={contractAgents.get(mapsite.fastCode?.toLowerCase() ?? "")?.agentName ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
