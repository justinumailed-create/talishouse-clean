"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sendMapSiteAssigned,
  sendMapSiteCompleted,
} from "@/lib/email";

export interface EmailActionResult {
  success: boolean;
  error?: string;
}

export async function assignBuildRequest(
  requestId: string,
  associateId: string
): Promise<EmailActionResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: buildData, error: buildError } = await supabaseAdmin
      .from("build_requests")
      .select("id, first_name, last_name, email, status")
      .eq("id", requestId)
      .single();

    if (buildError || !buildData) {
      return { success: false, error: "Build request not found" };
    }

    const { data: fcData } = await supabaseAdmin
      .from("fast_codes")
      .select("code")
      .eq("request_id", requestId)
      .maybeSingle();

    const fastCode = fcData?.code || "";

    const { data: associateData } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("id", associateId)
      .eq("role", "associate")
      .single();

    if (!associateData) {
      return { success: false, error: "Associate not found" };
    }

    const { error: msUpdateError } = await supabaseAdmin
      .from("mapsite_requests")
      .update({ assigned_to: associateId, status: "processing" })
      .eq("request_id", requestId);

    if (msUpdateError) {
      return { success: false, error: `Failed to assign: ${msUpdateError.message}` };
    }

    const { error: brUpdateError } = await supabaseAdmin
      .from("build_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (brUpdateError) {
      console.warn("[assignBuildRequest] Failed to update build_request status:", brUpdateError.message);
    }

    const { error: pqUpdateError } = await supabaseAdmin
      .from("production_queue")
      .update({ assigned_to: associateId, status: "processing" })
      .eq("request_id", requestId);

    if (pqUpdateError) {
      console.warn("[assignBuildRequest] Failed to update production queue:", pqUpdateError.message);
    }

    const clientName = `${buildData.first_name} ${buildData.last_name}`;

    sendMapSiteAssigned({
      to: associateData.email ?? "",
      recipientName: associateData.name || "Associate",
      clientName,
      fastCode,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[assignBuildRequest] Assignment email not sent:", result.error);
      }
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[assignBuildRequest] Error:", err);
    return { success: false, error: msg };
  }
}

export async function completeBuildRequest(
  requestId: string
): Promise<EmailActionResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: buildData, error: buildError } = await supabaseAdmin
      .from("build_requests")
      .select("id, first_name, last_name, email, status")
      .eq("id", requestId)
      .single();

    if (buildError || !buildData) {
      return { success: false, error: "Build request not found" };
    }

    const { data: fcData } = await supabaseAdmin
      .from("fast_codes")
      .select("code")
      .eq("request_id", requestId)
      .maybeSingle();

    const fastCode = fcData?.code || "";

    const { error: msUpdateError } = await supabaseAdmin
      .from("mapsite_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("request_id", requestId);

    if (msUpdateError) {
      return { success: false, error: `Failed to complete: ${msUpdateError.message}` };
    }

    const { error: brUpdateError } = await supabaseAdmin
      .from("build_requests")
      .update({ status: "completed" })
      .eq("id", requestId);

    if (brUpdateError) {
      console.warn("[completeBuildRequest] Failed to update build_request status:", brUpdateError.message);
    }

    const { error: pqUpdateError } = await supabaseAdmin
      .from("production_queue")
      .update({ status: "completed" })
      .eq("request_id", requestId);

    if (pqUpdateError) {
      console.warn("[completeBuildRequest] Failed to update production queue:", pqUpdateError.message);
    }

    const clientName = `${buildData.first_name} ${buildData.last_name}`;

    sendMapSiteCompleted({
      to: buildData.email,
      recipientName: clientName,
      fastCode,
      mapsiteUrl: `https://talispros.com/ma/${fastCode}`,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[completeBuildRequest] Completion email not sent:", result.error);
      }
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[completeBuildRequest] Error:", err);
    return { success: false, error: msg };
  }
}
