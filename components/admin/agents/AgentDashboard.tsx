import Link from "next/link";
import type { AgentAdminRecord, AgentMapSiteSummary } from "@/lib/agent-admins";
import type { ManualPaymentRecord } from "@/lib/manual-payments";
import AgentWorkPanel from "./AgentWorkPanel";
import CashPaymentsTable from "./CashPaymentsTable";

const card = "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Agent Admin dashboard. Rendered for the signed-in agent (/admin/agent) and,
 * read-only, for superadmin "View as agent" (/admin/agents/[id]/preview).
 * Shows only agent tasks, each behind its privilege. Agents have no public
 * page of their own and cannot edit one.
 */
export default function AgentDashboard({
  agent,
  mapsites,
  readOnly = false,
  payments = [],
}: {
  agent: AgentAdminRecord;
  mapsites: AgentMapSiteSummary[];
  readOnly?: boolean;
  payments?: ManualPaymentRecord[];
}) {
  const can = (scope: "mapsites" | "ebooks" | "pins" | "cash-payments") => agent.privileges.includes(scope);
  const canMapSites = can("mapsites");
  const canCash = can("cash-payments");
  const active = agent.status === "active";

  return (
    <div className="space-y-6">
      <header className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E4ED8] text-base font-semibold text-white">
            {initials(agent.name) || "A"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">Agent dashboard</p>
            <h1 className="text-xl font-semibold text-neutral-900">{agent.name}</h1>
            <p className="text-sm text-neutral-500">
              Login ID <span className="font-mono text-neutral-700">{agent.loginId}</span>
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-red-600"}`} />
          {active ? "Active" : "Disabled"}
        </span>
      </header>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Tasks</h2>
        {readOnly ? (
          <p className="mb-3 rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600">Read-only preview — forms are disabled.</p>
        ) : null}
        <AgentWorkPanel
          canMapSites={canMapSites}
          canEbooks={can("ebooks")}
          canPins={can("pins")}
          canCash={canCash}
          readOnly={readOnly}
        />
      </div>

      {canMapSites || can("ebooks") || can("pins") ? (
        <section className={`${card} p-6`}>
          <h2 className="text-[15px] font-semibold text-neutral-900">Assigned Mapsites</h2>
          {agent.assignedMapSites.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">No specific assignment — your privileges apply to all Mapsites.</p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
              {mapsites.map((site) => (
                <li key={site.fastCode} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-mono font-semibold uppercase text-neutral-900">{site.fastCode}</span>
                    <span className="ml-2 truncate text-neutral-500">
                      {site.propertyTitle || (site.status ? "Untitled" : "Not found")}
                    </span>
                  </span>
                  {canMapSites && !readOnly && site.status ? (
                    <Link
                      href={`/admin/mapsites/${encodeURIComponent(site.fastCode)}`}
                      className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs uppercase text-neutral-400">{site.status ?? "—"}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {agent.regions.length > 0 ? (
            <p className="mt-3 text-sm text-neutral-500">Regions: {agent.regions.join(", ")}</p>
          ) : null}
        </section>
      ) : null}

      {canCash ? (
        <section className={`${card} p-6`}>
          <h2 className="mb-4 text-[15px] font-semibold text-neutral-900">Cash payments I recorded</h2>
          <CashPaymentsTable payments={payments} />
        </section>
      ) : null}
    </div>
  );
}
