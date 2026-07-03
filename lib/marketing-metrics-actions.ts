"use server";

import { revalidatePath } from "next/cache";
import { requireMarketingManagerSession } from "@/lib/marketing-manager-auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface UpsertDailyMetricsInput {
  fastCode: string;
  reportDate: string;
  facebookImpressions: number;
  instagramImpressions: number;
  totalReach: number;
  emailsReceived: number;
  textsReceived: number;
  pipelineStatus: string;
  checklistNotes: string;
}

export async function upsertDailyMetrics(
  input: UpsertDailyMetricsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireMarketingManagerSession();
    const supabase = getSupabaseAdmin();
    const fastCode = input.fastCode.trim().toLowerCase();

    const { error } = await supabase.from("client_marketing_metrics").upsert(
      {
        fast_code: fastCode,
        report_date: input.reportDate,
        facebook_impressions: input.facebookImpressions,
        instagram_impressions: input.instagramImpressions,
        total_reach: input.totalReach,
        emails_received: input.emailsReceived,
        texts_received: input.textsReceived,
        pipeline_status: input.pipelineStatus,
        checklist_notes: input.checklistNotes.trim() || null,
        posted_by: session.email,
      },
      { onConflict: "fast_code,report_date" }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/talispros/client/dashboard");
    revalidatePath(`/talispros/marketing/clients/${fastCode}`);
    revalidatePath("/talispros/marketing");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unable to save metrics.",
    };
  }
}
