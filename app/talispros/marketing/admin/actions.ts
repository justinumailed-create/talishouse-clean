"use server";

import { revalidatePath } from "next/cache";
import {
  activateMapSiteForRequest,
  approveBuildRequestForMarketing,
  assignFastCode,
  generateDraftMapSite,
  getBuildRequestDetails,
  listBuildRequests,
  sendRegistration,
  setBuildRequestStatus,
  updateBuildRequestAssets,
  updateBuildRequestDetails,
  updateLinkedMapSiteResources,
  type BuildRequestListRow,
} from "@/app/admin/marketing/actions";
import { requireMarketingManagerSession } from "@/lib/marketing-manager-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  MARKETING_ADMIN_DEMOS_PATH,
  MARKETING_ADMIN_PATH,
  MARKETING_HOME_PATH,
} from "@/lib/mapsite-account-session";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import type { MapSiteResourceUpdates } from "@/lib/talispros/mapsite-platform";
import {
  deleteDemoMapSite,
  listDemoMapSites,
  updateDemoMapSite,
} from "@/lib/talispros/demo-mapsite-service";

function revalidateMarketingAdmin(requestId?: string) {
  revalidatePath(MARKETING_ADMIN_PATH);
  revalidatePath(MARKETING_ADMIN_DEMOS_PATH);
  revalidatePath(MARKETING_HOME_PATH);
  revalidatePath(MAPSITE_APP_PATH);
  if (requestId) {
    revalidatePath(`${MARKETING_ADMIN_PATH}/${requestId}`);
  }
}

export async function listMarketingRegistrations(): Promise<{
  ok: boolean;
  data: BuildRequestListRow[];
  error?: string;
}> {
  await requireMarketingManagerSession();
  const result = await listBuildRequests();
  if (!result.ok) return result;

  const marketTypes = new Set(["listings", "homes", "fsbos", "brokers", "adpro"]);
  const filtered = result.data.filter(
    (row) => row.market_type && marketTypes.has(row.market_type)
  );

  return { ok: true, data: filtered.length > 0 ? filtered : result.data };
}

export async function getMarketingRegistrationDetails(requestId: string) {
  await requireMarketingManagerSession();
  return getBuildRequestDetails(requestId);
}

export async function marketingAssignFastCode(requestId: string) {
  await requireMarketingManagerSession();
  const result = await assignFastCode(requestId);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingGenerateDraftMapSite(requestId: string) {
  await requireMarketingManagerSession();
  const result = await generateDraftMapSite(requestId);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingSendRegistration(requestId: string) {
  await requireMarketingManagerSession();
  const result = await sendRegistration(requestId);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingSetBuildRequestStatus(
  requestId: string,
  status:
    | "Under Review"
    | "Rejected"
    | "Changes Requested"
    | "Awaiting Registration"
    | "Published"
) {
  await requireMarketingManagerSession();
  const result = await setBuildRequestStatus(requestId, status);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingUpdateBuildRequestDetails(
  requestId: string,
  updates: Record<string, unknown>
) {
  await requireMarketingManagerSession();
  const result = await updateBuildRequestDetails(requestId, updates);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingUpdateBuildRequestAssets(
  requestId: string,
  updates: Record<string, string | null>
) {
  await requireMarketingManagerSession();
  const result = await updateBuildRequestAssets(requestId, updates);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingSetPaymentLink(
  requestId: string,
  paymentLink: string
): Promise<{ ok: boolean; error?: string }> {
  await requireMarketingManagerSession();

  const link = paymentLink.trim();
  if (!link) {
    return { ok: false, error: "Payment link is required." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("build_requests")
    .update({
      registration_link: link,
      status: "Awaiting Registration",
    })
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabaseAdmin.from("build_request_registrations").upsert(
    {
      build_request_id: requestId,
      registration_link: link,
      status: "pending",
    },
    { onConflict: "build_request_id" }
  );

  revalidateMarketingAdmin(requestId);
  return { ok: true };
}

export async function marketingApproveBuildRequest(requestId: string) {
  await requireMarketingManagerSession();
  const result = await approveBuildRequestForMarketing(requestId);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingActivateMapSite(requestId: string) {
  await requireMarketingManagerSession();
  const result = await activateMapSiteForRequest(requestId);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function marketingUpdateLinkedMapSite(
  requestId: string,
  updates: MapSiteResourceUpdates
) {
  await requireMarketingManagerSession();
  const result = await updateLinkedMapSiteResources(requestId, updates);
  if (result.ok) revalidateMarketingAdmin(requestId);
  return result;
}

export async function listMarketingDemoMapSites() {
  await requireMarketingManagerSession();
  return { ok: true as const, data: await listDemoMapSites() };
}

export async function marketingUpdateDemoMapSite(input: {
  mapsiteId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  latitude?: number;
  longitude?: number;
  mapZoom?: number;
}) {
  await requireMarketingManagerSession();
  const result = await updateDemoMapSite(input);
  if (result.ok) {
    revalidateMarketingAdmin();
    revalidatePath(`/mapsite/${input.mapsiteId}`);
  }
  return result;
}

export async function marketingDeleteDemoMapSite(mapsiteId: string) {
  await requireMarketingManagerSession();
  const result = await deleteDemoMapSite(mapsiteId);
  if (result.ok) {
    revalidateMarketingAdmin();
    revalidatePath(MAPSITE_APP_PATH);
  }
  return result;
}
