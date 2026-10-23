import Link from "next/link";
import { redirect } from "next/navigation";
import ExportLeadsButton from "@/components/admin/crm/ExportLeadsButton";
import { PageHeader, cardClass, fieldClass, primaryButton, secondaryButton } from "@/components/admin/agents/ui";
import { countryLabel, crmCopy, fill, positionLabel, statusLabel } from "@/lib/crm-leads/copy";
import { LEAD_COUNTRIES, LEAD_SORTS, LEAD_STATUSES } from "@/lib/crm-leads/model";
import { PAGE_SIZE, listBrokerageLeads, parseLeadFilters, requireCrmActor, type BrokerageLead } from "@/lib/crm-leads/server";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/admin/agent/leads");
}

export const dynamic = "force-dynamic";

const selectClass = fieldClass;

function qs(current: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  const text = next.toString();
  return text ? `/admin/agent/leads?${text}` : "/admin/agent/leads";
}

function when(iso: string, locale: "en" | "de"): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-CA", {
    dateStyle: "medium",
    timeZone: "America/Toronto",
  }).format(new Date(iso));
}

function statusTone(status: BrokerageLead["status"]): string {
  if (status === "registered") return "bg-green-50 text-green-800";
  if (status === "replied") return "bg-sky-50 text-sky-800";
  if (status === "contacted") return "bg-amber-50 text-amber-800";
  if (status === "not_interested") return "bg-neutral-100 text-neutral-600";
  return "bg-[#1E4ED8]/10 text-[#1E4ED8]";
}

export default async function BrokerageLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireCrmActor();
  if (!actor) redirect("/admin/agent");
  const locale = await getLocale();
  const copy = crmCopy(locale);
  const sp = await searchParams;
  const filters = parseLeadFilters(sp, actor);
  const { leads, total, markets, agents } = await listBrokerageLeads(actor, filters);
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.country) params.set("country", filters.country);
  if (filters.market) params.set("market", filters.market);
  if (filters.agentId) params.set("agent", filters.agentId);
  params.set("scope", filters.scope);
  params.set("sort", filters.sort);
  params.set("dir", filters.dir);
  const from = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(filters.page * PAGE_SIZE, total);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const subtitle = actor.role === "superadmin"
    ? copy.listSubtitleAdmin
    : filters.scope === "all"
      ? copy.listSubtitleAllAgent
      : copy.listSubtitleMine;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={copy.kicker}
        title={copy.listTitle}
        subtitle={subtitle}
        actions={
          <>
            <Link href="/admin/agent/leads/import" className={secondaryButton}>{copy.import}</Link>
            <Link href="/admin/agent/leads/new" className={primaryButton}>{copy.add}</Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link href={qs(params, { scope: "mine", page: null })} className={filters.scope === "mine" ? primaryButton : secondaryButton}>{copy.mine}</Link>
        <Link href={qs(params, { scope: "all", page: null })} className={filters.scope === "all" ? primaryButton : secondaryButton}>{copy.all}</Link>
      </div>

      <form action="/admin/agent/leads" className={`${cardClass} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3`}>
        <input type="hidden" name="scope" value={filters.scope} />
        <label className="text-sm text-neutral-700 sm:col-span-2 lg:col-span-3">
          <span className="mb-1.5 block text-xs font-medium">{copy.search}</span>
          <input name="q" defaultValue={filters.q} placeholder={copy.searchPlaceholder} className={selectClass} />
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1.5 block text-xs font-medium">{copy.status}</span>
          <select name="status" defaultValue={filters.status} className={selectClass}>
            <option value="">{copy.any}</option>
            {LEAD_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(copy, status)}</option>)}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1.5 block text-xs font-medium">{copy.country}</span>
          <select name="country" defaultValue={filters.country} className={selectClass}>
            <option value="">{copy.any}</option>
            {LEAD_COUNTRIES.map((country) => <option key={country} value={country}>{countryLabel(copy, country)}</option>)}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1.5 block text-xs font-medium">{copy.market}</span>
          <input name="market" list="lead-markets" defaultValue={filters.market} className={selectClass} />
          <datalist id="lead-markets">
            {markets.map((market) => <option key={market} value={market} />)}
          </datalist>
        </label>
        {filters.scope === "all" ? (
          <label className="text-sm text-neutral-700">
            <span className="mb-1.5 block text-xs font-medium">{copy.agent}</span>
            <select name="agent" defaultValue={filters.agentId} className={selectClass}>
              <option value="">{copy.any}</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
          </label>
        ) : null}
        <label className="text-sm text-neutral-700">
          <span className="mb-1.5 block text-xs font-medium">{copy.sort}</span>
          <select name="sort" defaultValue={filters.sort} className={selectClass}>
            {LEAD_SORTS.map((sort) => <option key={sort} value={sort}>{copy.sorts[sort]}</option>)}
          </select>
        </label>
        <label className="text-sm text-neutral-700">
          <span className="mb-1.5 block text-xs font-medium">{copy.dir.desc}</span>
          <select name="dir" defaultValue={filters.dir} className={selectClass}>
            <option value="desc">{copy.dir.desc}</option>
            <option value="asc">{copy.dir.asc}</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button type="submit" className={primaryButton}>{copy.apply}</button>
          <Link href="/admin/agent/leads" className={secondaryButton}>{copy.reset}</Link>
          <ExportLeadsButton filters={filters} label={copy.export} emptyLabel={copy.exportEmpty} />
        </div>
      </form>

      <p className="text-sm text-neutral-500">{total === 0 ? copy.resultsEmpty : fill(copy.results, { from, to, total })}</p>

      {leads.length === 0 ? (
        <p className={`${cardClass} p-6 text-sm text-neutral-600`}>
          {filters.q || filters.status || filters.country || filters.market || filters.agentId
            ? copy.empty
            : filters.scope === "mine"
              ? copy.emptyMine
              : copy.emptyAll}
        </p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id} className={`${cardClass} space-y-2 p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{lead.decisionMakerName}</p>
                    <p className="text-sm text-neutral-600">{positionLabel(copy, lead.position)} · {lead.brokerageName}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(lead.status)}`}>{statusLabel(copy, lead.status)}</span>
                </div>
                <p className="text-sm text-neutral-600">{countryLabel(copy, lead.country)}{lead.market ? ` · ${lead.market}` : ""}</p>
                <p className="text-sm text-neutral-700">{lead.cellPhone || lead.email || "—"}</p>
                {filters.scope === "all" ? <p className="text-xs text-neutral-500">{lead.createdByName}</p> : null}
                <Link href={`/admin/agent/leads/${lead.id}`} className="inline-flex text-sm font-semibold text-[#1E4ED8]">
                  {actor.role === "superadmin" || actor.agentId === lead.createdByAgentId ? copy.edit : copy.view}
                </Link>
              </li>
            ))}
          </ul>
          <div className={`${cardClass} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{copy.columns.person}</th>
                  <th className="px-4 py-3">{copy.columns.brokerage}</th>
                  <th className="px-4 py-3">{copy.columns.contact}</th>
                  <th className="px-4 py-3">{copy.columns.place}</th>
                  <th className="px-4 py-3">{copy.columns.status}</th>
                  {filters.scope === "all" ? <th className="px-4 py-3">{copy.columns.agent}</th> : null}
                  <th className="px-4 py-3">{copy.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {leads.map((lead) => {
                  const editable = actor.role === "superadmin" || actor.agentId === lead.createdByAgentId;
                  return (
                    <tr key={lead.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{lead.decisionMakerName}</p>
                        <p className="text-xs text-neutral-500">{positionLabel(copy, lead.position)} · {when(lead.createdAt, locale)}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{lead.brokerageName}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        <p>{lead.cellPhone || "—"}</p>
                        <p className="text-xs text-neutral-500">{lead.email}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{countryLabel(copy, lead.country)}{lead.market ? ` · ${lead.market}` : ""}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(lead.status)}`}>{statusLabel(copy, lead.status)}</span></td>
                      {filters.scope === "all" ? <td className="px-4 py-3 text-neutral-700">{lead.createdByName}</td> : null}
                      <td className="px-4 py-3">
                        <Link href={`/admin/agent/leads/${lead.id}`} className="font-semibold text-[#1E4ED8]">{editable ? copy.edit : copy.view}</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pages > 1 ? (
        <div className="flex gap-2">
          {filters.page > 1 ? <Link className={secondaryButton} href={qs(params, { page: String(filters.page - 1) })}>{copy.prev}</Link> : null}
          {filters.page < pages ? <Link className={secondaryButton} href={qs(params, { page: String(filters.page + 1) })}>{copy.next}</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
