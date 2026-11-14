"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isMissingDashboardViewColumn } from "@/lib/talispros/mapsite-dashboard-view";

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
  const account = await requireMapsAdmin();
  if (!account) return { ok: false, error: "You do not have permission to change this Mapsite." };
  const code = fastCode.trim().toLowerCase();
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
  revalidatePath(`/talispros/mapsite`);
  return { ok: true };
}
