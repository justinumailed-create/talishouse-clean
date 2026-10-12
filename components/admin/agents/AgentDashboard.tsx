import Link from "next/link";
import { AGENT_SCOPE_LABELS, type AgentGrantableScope } from "@/lib/admin-constants";
import { getAgentNavItems } from "@/lib/admin-nav";
import type { AgentAdminRecord, AgentMapSiteSummary } from "@/lib/agent-admins";
import type { ManualPaymentRecord } from "@/lib/manual-payments";
import AgentWorkPanel from "./AgentWorkPanel";
import CashPaymentsTable from "./CashPaymentsTable";

/**
 * Agent Admin dashboard. Rendered for the signed-in agent (/admin/agent) and,
 * read-only, for superadmin "View as agent" (/admin/agents/[id]/preview).
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
  const canCash = agent.privileges.includes("cash-payments");
  const tools = getAgentNavItems(agent.privileges).filter((item) => item.href !== "/admin/agent");
  const canMapSites = agent.privileges.includes("mapsites");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">Agent dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{agent.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Login ID <span className="font-mono">{agent.loginId}</span>
          {agent.email ? ` · ${agent.email}` : ""}
          {agent.phone ? ` · ${agent.phone}` : ""}
          {" · "}
          <span className={agent.status === "active" ? "text-green-700" : "text-red-600"}>{agent.status}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Your tools</h2>
        {tools.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No privileges granted yet. Ask a superadmin to assign some.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {tools.map((item) => (
              <li key={item.href}>
                {readOnly ? (
                  <span className="block rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                    {item.label} <span className="text-xs text-neutral-400">({item.href})</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="block rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 hover:bg-neutral-50"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.privileges.map((scope: AgentGrantableScope) => (
            <span key={scope} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
              {AGENT_SCOPE_LABELS[scope]}
            </span>
          ))}
        </div>
      </section>

      <AgentWorkPanel
        canMapSites={canMapSites}
        canEbooks={agent.privileges.includes("ebooks")}
        canPins={agent.privileges.includes("pins")}
        canCash={canCash}
        readOnly={readOnly}
      />

      {canCash ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Cash payments I recorded</h2>
          <CashPaymentsTable payments={payments} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Assigned Mapsites</h2>
        {agent.assignedMapSites.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            {agent.privileges.length > 0 ? "No specific assignment — your privileges apply to all Mapsites." : "None."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
            {mapsites.map((site) => (
              <li key={site.fastCode} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-mono font-semibold uppercase">{site.fastCode}</span>{" "}
                  <span className="text-neutral-500">{site.propertyTitle || (site.status ? "Untitled" : "not found")}</span>
                </span>
                {canMapSites && !readOnly && site.status ? (
                  <Link href={`/admin/mapsites/${encodeURIComponent(site.fastCode)}`} className="text-[#1E4ED8] underline">
                    Edit
                  </Link>
                ) : (
                  <span className="text-xs uppercase text-neutral-400">{site.status ?? "—"}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {agent.regions.length > 0 ? (
          <p className="mt-3 text-sm text-neutral-600">Regions: {agent.regions.join(", ")}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">Landing page</h2>
          <a
            href={`/associate/${encodeURIComponent(agent.loginId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#1E4ED8] underline"
          >
            /associate/{agent.loginId}
          </a>
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-900">{agent.pageHeadline || "No headline yet"}</p>
        {agent.pageSubtext ? <p className="text-sm text-neutral-600">{agent.pageSubtext}</p> : null}
        {agent.privileges.includes("agent-pages") && !readOnly ? (
          <Link href="/admin/agent/page" className="mt-3 inline-block text-sm text-[#1E4ED8] underline">
            Edit my page
          </Link>
        ) : null}
      </section>
    </div>
  );
}
