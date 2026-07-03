import { getSupabaseAdmin } from "./supabaseAdmin";

export interface ClientMarketingMetric {
  id: string;
  fastCode: string;
  reportDate: string;
  facebookImpressions: number;
  instagramImpressions: number;
  totalReach: number;
  emailsReceived: number;
  textsReceived: number;
  pipelineStatus: string;
  checklistNotes: string | null;
  postedBy: string | null;
  createdAt: string;
}

export interface ClientWeeklyReport {
  id: string;
  fastCode: string;
  weekStart: string;
  weekEnd: string;
  summaryText: string;
  facebookImpressionsTotal: number;
  instagramImpressionsTotal: number;
  totalReachTotal: number;
  emailsReceivedTotal: number;
  textsReceivedTotal: number;
  pipelineStatus: string;
  generatedAt: string;
}

export interface ClientDashboardContext {
  fastCode: string;
  propertyTitle: string | null;
  agentName: string | null;
  ownerName: string;
  latestMetrics: ClientMarketingMetric | null;
  recentChecklists: ClientMarketingMetric[];
  recentMetricsHistory: ClientMarketingMetric[];
  weeklyReports: ClientWeeklyReport[];
}

function mapMetricRow(row: {
  id: string;
  fast_code: string;
  report_date: string;
  facebook_impressions: number;
  instagram_impressions: number;
  total_reach: number;
  emails_received: number;
  texts_received: number;
  pipeline_status: string;
  checklist_notes: string | null;
  posted_by: string | null;
  created_at: string;
}): ClientMarketingMetric {
  return {
    id: row.id,
    fastCode: row.fast_code,
    reportDate: row.report_date,
    facebookImpressions: row.facebook_impressions,
    instagramImpressions: row.instagram_impressions,
    totalReach: row.total_reach,
    emailsReceived: row.emails_received,
    textsReceived: row.texts_received,
    pipelineStatus: row.pipeline_status,
    checklistNotes: row.checklist_notes,
    postedBy: row.posted_by,
    createdAt: row.created_at,
  };
}

function mapReportRow(row: {
  id: string;
  fast_code: string;
  week_start: string;
  week_end: string;
  summary_text: string;
  facebook_impressions_total: number;
  instagram_impressions_total: number;
  total_reach_total: number;
  emails_received_total: number;
  texts_received_total: number;
  pipeline_status: string;
  generated_at: string;
}): ClientWeeklyReport {
  return {
    id: row.id,
    fastCode: row.fast_code,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    summaryText: row.summary_text,
    facebookImpressionsTotal: row.facebook_impressions_total,
    instagramImpressionsTotal: row.instagram_impressions_total,
    totalReachTotal: row.total_reach_total,
    emailsReceivedTotal: row.emails_received_total,
    textsReceivedTotal: row.texts_received_total,
    pipelineStatus: row.pipeline_status,
    generatedAt: row.generated_at,
  };
}

export async function getClientDashboardContext(
  fastCode: string,
  displayName: string
): Promise<ClientDashboardContext> {
  const supabase = getSupabaseAdmin();
  const normalizedCode = fastCode.trim().toLowerCase();

  const [{ data: mapsite }, { data: latestRows }, { data: checklistRows }, { data: historyRows }, { data: reportRows }] =
    await Promise.all([
      supabase
        .from("mapsites")
        .select("property_title, agent_name, owner_first_name, owner_last_name")
        .ilike("fast_code", normalizedCode)
        .maybeSingle(),
      supabase
        .from("client_marketing_metrics")
        .select("*")
        .ilike("fast_code", normalizedCode)
        .order("report_date", { ascending: false })
        .limit(1),
      supabase
        .from("client_marketing_metrics")
        .select("*")
        .ilike("fast_code", normalizedCode)
        .not("checklist_notes", "is", null)
        .order("report_date", { ascending: false })
        .limit(10),
      supabase
        .from("client_marketing_metrics")
        .select("*")
        .ilike("fast_code", normalizedCode)
        .order("report_date", { ascending: true })
        .limit(7),
      supabase
        .from("client_weekly_reports")
        .select("*")
        .ilike("fast_code", normalizedCode)
        .order("week_start", { ascending: false })
        .limit(4),
    ]);

  const ownerName = mapsite
    ? `${mapsite.owner_first_name} ${mapsite.owner_last_name}`.trim()
    : displayName;

  return {
    fastCode: normalizedCode,
    propertyTitle: mapsite?.property_title ?? null,
    agentName: mapsite?.agent_name ?? null,
    ownerName,
    latestMetrics: latestRows?.[0] ? mapMetricRow(latestRows[0]) : null,
    recentChecklists: (checklistRows ?? []).map(mapMetricRow),
    recentMetricsHistory: (historyRows ?? []).map(mapMetricRow),
    weeklyReports: (reportRows ?? []).map(mapReportRow),
  };
}

export async function listActiveMapSitesForMarketing(): Promise<
  Array<{
    fastCode: string;
    ownerName: string;
    propertyTitle: string | null;
    email: string;
    status: string;
  }>
> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("mapsites")
    .select("fast_code, owner_first_name, owner_last_name, property_title, email, status")
    .eq("status", "active")
    .order("owner_last_name", { ascending: true });

  return (data ?? []).map((row) => ({
    fastCode: row.fast_code,
    ownerName: `${row.owner_first_name} ${row.owner_last_name}`.trim(),
    propertyTitle: row.property_title,
    email: row.email,
    status: row.status,
  }));
}

export async function getRecentMetricsForClient(
  fastCode: string,
  limit = 14
): Promise<ClientMarketingMetric[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("client_marketing_metrics")
    .select("*")
    .ilike("fast_code", fastCode.trim().toLowerCase())
    .order("report_date", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapMetricRow);
}
