import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  aggregateWeeklyReport,
  getPreviousWeekRange,
} from "@/lib/weekly-report-generator";
import { sendWeeklyMarketingReport } from "@/lib/email";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { weekStart, weekEnd } = getPreviousWeekRange();

  const { data: fastCodes, error: codesError } = await supabase
    .from("client_marketing_metrics")
    .select("fast_code")
    .gte("report_date", weekStart)
    .lte("report_date", weekEnd);

  if (codesError) {
    return NextResponse.json({ error: codesError.message }, { status: 500 });
  }

  const uniqueCodes = [
    ...new Set((fastCodes ?? []).map((row) => row.fast_code.toLowerCase())),
  ];

  const results: Array<{ fastCode: string; success: boolean; error?: string }> = [];

  for (const fastCode of uniqueCodes) {
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from("client_marketing_metrics")
        .select("*")
        .ilike("fast_code", fastCode)
        .gte("report_date", weekStart)
        .lte("report_date", weekEnd)
        .order("report_date", { ascending: true });

      if (metricsError) {
        results.push({ fastCode, success: false, error: metricsError.message });
        continue;
      }

      const aggregate = aggregateWeeklyReport(
        fastCode,
        weekStart,
        weekEnd,
        (metrics ?? []).map((row) => ({
          reportDate: row.report_date,
          facebookImpressions: row.facebook_impressions,
          instagramImpressions: row.instagram_impressions,
          totalReach: row.total_reach,
          emailsReceived: row.emails_received,
          textsReceived: row.texts_received,
          pipelineStatus: row.pipeline_status,
        }))
      );

      const { error: upsertError } = await supabase.from("client_weekly_reports").upsert(
        {
          fast_code: fastCode,
          week_start: aggregate.weekStart,
          week_end: aggregate.weekEnd,
          summary_text: aggregate.summaryText,
          facebook_impressions_total: aggregate.facebookImpressionsTotal,
          instagram_impressions_total: aggregate.instagramImpressionsTotal,
          total_reach_total: aggregate.totalReachTotal,
          emails_received_total: aggregate.emailsReceivedTotal,
          texts_received_total: aggregate.textsReceivedTotal,
          pipeline_status: aggregate.pipelineStatus,
        },
        { onConflict: "fast_code,week_start" }
      );

      if (upsertError) {
        results.push({ fastCode, success: false, error: upsertError.message });
        continue;
      }

      const { data: mapsite } = await supabase
        .from("mapsites")
        .select("email, owner_first_name, owner_last_name")
        .ilike("fast_code", fastCode)
        .maybeSingle();

      if (mapsite?.email) {
        await sendWeeklyMarketingReport({
          to: mapsite.email,
          recipientName: `${mapsite.owner_first_name} ${mapsite.owner_last_name}`.trim(),
          fastCode,
          summaryText: aggregate.summaryText,
        });
      }

      results.push({ fastCode, success: true });
    } catch (err) {
      results.push({
        fastCode,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    weekStart,
    weekEnd,
    processed: results.length,
    results,
  });
}
