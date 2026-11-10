import LeadsToApprove, { type LeadQuery } from "@/components/admin/LeadsToApprove";
import { isLeadFilter, type LeadFilter, type ProspectCountry } from "@/lib/talispros/prospect-approval";
import { loadLeadsToApprove } from "@/lib/talispros/prospect-approval-server";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const PRESERVE = ["day", "agent", "stage", "code", "talisbotDay", "talisbotPreview"] as const;

export default async function LeadsToApproveSection({
  locale,
  query,
}: {
  locale: "en" | "de";
  query: Record<string, string | string[] | undefined>;
}) {
  const country: ProspectCountry = one(query.leadCountry) === "US" ? "US" : "CA";
  const statusRaw = one(query.leadStatus);
  const status: LeadFilter = isLeadFilter(statusRaw) ? statusRaw : "pending";
  const from = one(query.leadFrom);
  const to = one(query.leadTo);
  const completeRaw = one(query.leadComplete);
  const complete = completeRaw === "complete" || completeRaw === "incomplete" ? completeRaw : "";
  const page = Number(one(query.leadPage) ?? "1");
  const run = one(query.leadRun) ?? "";
  const added = one(query.leadAdded) ?? "";
  const leadQuery: LeadQuery = {
    country,
    status,
    from: from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : "",
    to: to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : "",
    complete,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    run: /^[0-9a-f-]{36}$/i.test(run) ? run : "",
    added: /^\d{4}-\d{2}-\d{2}$/.test(added) ? added : "",
  };
  const preserve: Record<string, string> = {};
  for (const key of PRESERVE) {
    const value = one(query[key]);
    if (value) preserve[key] = value;
  }

  const loaded = await loadLeadsToApprove({
    country,
    status,
    from: leadQuery.from || null,
    to: leadQuery.to || null,
    complete: leadQuery.complete || null,
    page: leadQuery.page,
    runId: leadQuery.run || null,
  });
  return (
    <LeadsToApprove
      locale={locale}
      rows={loaded.rows}
      pendingCa={loaded.pendingCa}
      pendingUs={loaded.pendingUs}
      total={loaded.total}
      pageCount={loaded.pageCount}
      query={{ ...leadQuery, page: loaded.page }}
      preserve={preserve}
      needsReviewIds={loaded.needsReviewIds}
      runApplied={loaded.runApplied}
    />
  );
}
