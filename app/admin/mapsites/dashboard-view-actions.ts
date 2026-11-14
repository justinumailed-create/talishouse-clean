"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { isOwnMapSite } from "@/lib/mapsite-edit-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import {
  canChangeMapsiteDashboardView,
  isMissingDashboardViewColumn,
} from "@/lib/talispros/mapsite-dashboard-view";

async function requireMapsAdmin() {
  const account = await getAdminSessionAccount();
  if (!account || account.access === "agent") return null;
  if (!accountHasAdminScope(account, "mapsites")) return null;
  return account;
}

export async function setMapsiteDashboardViewAction(
  fastCode: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string; pendingMigration?: boolean }> {
  const code = fastCode.trim().toLowerCase();
  const [account, owner] = await Promise.all([
    requireMapsAdmin(),
    code ? isOwnMapSite(code) : Promise.resolve(false),
  ]);
  if (!canChangeMapsiteDashboardView({ isMapsAdmin: Boolean(account), isOwner: owner })) {
    return { ok: false, error: "You do not have permission to change this Mapsite." };
  }
  if (!code || !isSupabaseAdminConfigured()) {
    return { ok: false, error: "Mapsite storage is not available." };
  }
  const mapsite = await getMapSiteByFastCode(code);
  if (!mapsite) return { ok: false, error: "No Mapsite found for that FAST Code." };
  const { error } = await (
    getSupabaseAdmin().from("mapsites") as unknown as {
      update: (row: { dashboard_view_enabled: boolean }) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({ dashboard_view_enabled: enabled })
    .eq("id", mapsite.id);
  if (error) {
    if (isMissingDashboardViewColumn(error.message)) {
      return {
        ok: false,
        pendingMigration: true,
        error: "Apply supabase/migrations/126_mapsite_dashboard_view.sql before this can be saved.",
      };
    }
    return { ok: false, error: "Could not update the dashboard view." };
  }
  revalidatePath(`/admin/mapsites/${code}`);
  revalidatePath("/talispros/mapsite", "layout");
  if (mapsite.claimAudience) {
    revalidatePath(
      buildClaimedMapSitePath({ fastCode: code, audience: mapsite.claimAudience }),
    );
  }
  return { ok: true };
}
