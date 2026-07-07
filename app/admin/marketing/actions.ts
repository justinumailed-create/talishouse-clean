"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateFastCode } from "@/services/fast-code.service";

export async function approveBuildRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("build_requests")
      .select("id, status, first_name, last_name, email, requested_fast_code")
      .eq("id", requestId)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: "Build request not found." };
    }

    const reservedFastCode =
      existing.requested_fast_code ||
      (await generateFastCode({ firstName: existing.first_name, lastName: existing.last_name }));
    const registrationLink = `/talispros/register?request=${existing.id}`;

    await supabaseAdmin.from("build_request_registrations").upsert(
      {
        build_request_id: existing.id,
        registration_link: registrationLink,
        status: "pending",
      },
      { onConflict: "build_request_id" }
    );

    const { error: updateError } = await supabaseAdmin
      .from("build_requests")
      .update({
        status: "Awaiting Registration",
        approval_status: "Approved",
        approved_at: new Date().toISOString(),
        requested_fast_code: reservedFastCode,
        registration_link: registrationLink,
      })
      .eq("id", existing.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function setBuildRequestStatus(
  requestId: string,
  status:
    | "Under Review"
    | "Rejected"
    | "Changes Requested"
    | "Awaiting Registration"
    | "Published"
): Promise<{ ok: boolean; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const payload: Record<string, string> = { status };
  if (status === "Published") {
    payload.activated_at = new Date().toISOString();
  }
  const { error } = await supabaseAdmin.from("build_requests").update(payload).eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
