import Link from "next/link";
import type { AgentAdminRecord, AgentMapSiteSummary } from "@/lib/agent-admins";
import type { ManualPaymentRecord } from "@/lib/manual-payments";
import { crmCopy } from "@/lib/crm-leads/copy";
import { getLocale } from "@/lib/i18n/server";
import { flowUi } from "@/lib/talispros/call-flow-copy";
import { loadAgentBoard, loadAgentStats, loadLeaderboard, loadReviewBoard } from "@/lib/talispros/call-flow-server";
import { AssignedMapsites, Leaderboard } from "./CallFlowPanels";
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
export default async function AgentDashboard({
  agent,
  mapsites,
  readOnly = false,
  payments = [],
  chatUnread = 0,
}: {
  chatUnread?: number;
  agent: AgentAdminRecord;
  mapsites: AgentMapSiteSummary[];
  readOnly?: boolean;
  payments?: ManualPaymentRecord[];
}) {
  const can = (scope: "mapsites" | "ebooks" | "pins" | "cash-payments" | "leads-crm") =>
    agent.privileges.includes(scope);
  const canMapSites = can("mapsites");
  const canCash = can("cash-payments");
  const canLeads = can("leads-crm");
  const locale = (await getLocale()) === "de" ? "de" : "en";
  const leadsCopy = crmCopy(locale);
  const ui = flowUi(locale);
  const active = agent.status === "active";
  const [cards, board, stats] = await Promise.all([
    agent.reviewer ? loadReviewBoard() : loadAgentBoard(agent.id),
    loadLeaderboard(),
    agent.reviewer ? Promise.resolve(null) : loadAgentStats(agent.id),
  ]);

  return (
    <div className="space-y-6">
      <header className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E4ED8] text-base font-semibold text-white">
            {initials(agent.name) || "A"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{ui.kicker}</p>
            <h1 className="text-xl font-semibold text-neutral-900">{agent.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">{ui.brand}</p>
            <p className="text-sm text-neutral-500">
              {ui.login} <span className="font-mono text-neutral-700">{agent.loginId}</span>
            </p>
            {stats ? (
              <p className="mt-1 text-sm text-neutral-600" data-testid="agent-streak">
                {ui.you}: {stats.streak} {ui.streak} · {stats.points} {ui.points}
                {stats.badges.length
                  ? ` · ${stats.badges.map((key) => (key === "first_call" ? ui.first_call : key === "first_demo" ? ui.first_demo : ui.first_registration)).join(" · ")}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {readOnly ? null : (
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
              {ui.chat}
              {chatUnread > 0 ? (
                <span className="rounded-full bg-[#1E4ED8] px-2 py-0.5 text-xs font-semibold text-white">
                  {chatUnread} {ui.unread}
                </span>
              ) : null}
            </Link>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-red-600"}`} />
            {active ? ui.active : ui.disabled}
          </span>
        </div>
      </header>

      <div data-testid="agent-dashboard-home" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <AssignedMapsites
          cards={cards}
          ui={agent.reviewer ? { ...ui, empty: ui.emptyReview } : ui}
          locale={locale}
          hrefFor={(code) => `/admin/agent/flow/${code.toLowerCase()}`}
          showDisqualify={!readOnly && !agent.reviewer}
        />
        <Leaderboard rows={board} ui={ui} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{ui.tasks}</h2>
        {readOnly ? (
          <p className="mb-3 rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600">{ui.readOnly}</p>
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
          <h2 className="text-[15px] font-semibold text-neutral-900">{locale === "de" ? "Mapsites bearbeiten" : "Edit Mapsites"}</h2>
          {agent.assignedMapSites.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-500">
              {locale === "de" ? "Keine einzelne Zuordnung. Ihre Rechte gelten für alle Mapsites." : "No single assignment. Your privileges apply to every Mapsite."}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
              {mapsites.map((site) => (
                <li key={site.fastCode} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-mono font-semibold uppercase text-neutral-900">{site.fastCode}</span>
                    <span className="ml-2 truncate text-neutral-500">
                      {site.propertyTitle || (site.status ? (locale === "de" ? "Ohne Titel" : "Untitled") : (locale === "de" ? "Nicht gefunden" : "Not found"))}
                    </span>
                  </span>
                  {canMapSites && !readOnly && site.status ? (
                    <Link
                      href={`/admin/mapsites/${encodeURIComponent(site.fastCode)}`}
                      className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      {locale === "de" ? "Bearbeiten" : "Edit"}
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs uppercase text-neutral-400">{site.status ?? "—"}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {agent.regions.length > 0 ? (
            <p className="mt-3 text-sm text-neutral-500">{locale === "de" ? "Regionen" : "Regions"}: {agent.regions.join(", ")}</p>
          ) : null}
        </section>
      ) : null}

      {canCash ? (
        <section className={`${card} p-6`}>
          <h2 className="mb-4 text-[15px] font-semibold text-neutral-900">{locale === "de" ? "Von mir erfasste Barzahlungen" : "Cash payments I recorded"}</h2>
          <CashPaymentsTable payments={payments} />
        </section>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2" data-testid="agent-quick-links">
        {[
          { href: "/admin/agent/notes", title: locale === "de" ? "Tagesnotizen" : "Daily notes", text: locale === "de" ? "Heutige Aufgaben und Dokumente." : "Log today’s tasks and upload documents.", badge: 0 },
          ...(canLeads
            ? [{ href: "/admin/agent/leads", title: leadsCopy.dashboardTitle, text: leadsCopy.dashboardText, badge: 0 }]
            : []),
        ].map((item) => {
          const inner = (
            <>
              <span>
                <span className="block text-[15px] font-semibold text-neutral-900">{item.title}</span>
                <span className="mt-0.5 block text-[13px] text-neutral-500">{item.text}</span>
              </span>
              {item.badge > 0 ? (
                <span className="rounded-full bg-[#1E4ED8] px-2.5 py-0.5 text-xs font-semibold text-white">{item.badge} unread</span>
              ) : (
                <span aria-hidden className="text-neutral-400">→</span>
              )}
            </>
          );
          return readOnly ? (
            <div key={item.href} className={`${card} flex items-center justify-between gap-3 p-5`}>{inner}</div>
          ) : (
            <Link key={item.href} href={item.href} className={`${card} flex items-center justify-between gap-3 p-5 transition hover:border-[#1E4ED8]/40`}>
              {inner}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
