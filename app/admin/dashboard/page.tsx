import Link from "next/link";
import { getAdminSessionAccount, requireAdminPage } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import { getAdminNavItems } from "@/lib/admin-nav";
import TalisBooksAdminHome from "@/components/admin/TalisBooksAdminHome";
import TalisMapsAdminHome from "@/components/admin/TalisMapsAdminHome";
import { NAV_ICON } from "@/components/admin/admin-nav-groups";
import { PageHeader, StatCard, cardClass } from "@/components/admin/ui";
import { istDate, isAgentOnline } from "@/lib/agent-collab";
import { getAgentPresence, listAgentNotes } from "@/lib/agent-collab-server";
import { listAgents } from "@/lib/agent-admins";
import { listManualPayments } from "@/lib/manual-payments";
import FastCodesTracker from "@/components/admin/FastCodesTracker";
import LeadsToApproveSection from "@/components/admin/LeadsToApproveSection";
import TalisbotMessagesSection from "@/components/admin/TalisbotMessagesSection";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DESCRIPTIONS: Record<string, string> = {
  "/admin/notifications": "Alerts and recent platform events.",
  "/admin/build-requests": "Incoming Mapsite build requests.",
  "/admin/mapsites": "Edit Mapsites, content and media.",
  "/admin/seo": "Titles, descriptions and share cards.",
  "/admin/talisbooks/bookshelves": "Curate Talisbooks™ bookshelves.",
  "/admin/fast-codes": "Issue and manage FAST Codes.",
  "/admin/contracts": "Signed Service Agreements and agent codes — which client belongs to which agent.",
  "/admin/pmc": "Regional pins and claimed Mapsites.",
  "/admin/agents": "Agent accounts, activity and notes.",
  "/admin/registrations": "Market registrations.",
  "/admin/marketing": "Marketing requests.",
  "/admin/contact-from-leads": "Leads asking to be contacted.",
};

async function agentSummary() {
  try {
    const [{ agents }, payments, notes] = await Promise.all([
      listAgents(),
      listManualPayments({ limit: 500 }),
      listAgentNotes({ from: istDate(), to: istDate() }),
    ]);
    const presence = await getAgentPresence(agents.map((a) => a.id));
    const online = agents.filter((a) => isAgentOnline(presence.get(a.id) ?? null)).length;
    const recorded = payments.filter((p) => p.status === "recorded");
    const totalCad = recorded.reduce((sum, p) => sum + p.amountCad, 0);
    return {
      agents: agents.filter((a) => a.status === "active").length,
      online,
      notesToday: notes.length,
      cashCount: recorded.length,
      cashCad: totalCad,
    };
  } catch {
    return null;
  }
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const locale = (await getLocale()) === "de" ? "de" : "en";
  const account = await getAdminSessionAccount();
  const canAgents = accountHasAdminScope(account, "agents");
  const summary = canAgents ? await agentSummary() : null;
  const shortcuts = getAdminNavItems(account).filter((i) => i.href !== "/admin/dashboard");

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Overview"
        title={account ? `Welcome back, ${account.name.split(" ")[0]}` : "Dashboard"}
        subtitle="Tsplits™ administration: Mapsites, Talisbooks™, Talismaps™ and agents."
      />

      {canAgents ? (
        <>
          <LeadsToApproveSection locale={locale} query={query} />
          <TalisbotMessagesSection
            locale={locale}
            talisbotDay={one(query.talisbotDay)}
            preview={one(query.talisbotPreview)}
            query={query}
          />
          <FastCodesTracker
            locale={locale}
            params={{ day: one(query.day), agent: one(query.agent), stage: one(query.stage), code: one(query.code) }}
            preserve={Object.fromEntries(
              ["leadCountry", "leadStatus", "leadFrom", "leadTo", "leadComplete", "leadPage", "leadRun", "leadAdded", "talisbotDay"].flatMap((key) => {
                const value = one(query[key]);
                return value ? [[key, value]] : [];
              }),
            )}
          />
        </>
      ) : null}

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active agents" value={summary.agents} hint={`${summary.online} online now`} />
          <StatCard label="Daily notes today" value={summary.notesToday} hint="Across all agents (IST)" />
          <StatCard label="Cash payments" value={summary.cashCount} hint="Recorded, not reversed" />
          <StatCard
            label="Cash collected"
            value={`CA$${summary.cashCad.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            hint="CAD, agent-recorded"
          />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Shortcuts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className={`${cardClass} group flex items-start gap-3 p-5 transition hover:border-[#1E4ED8]/40`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4ED8]/10 text-[#1E4ED8]">
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={NAV_ICON[item.href] ?? "M12 12h.01"} />
                </svg>
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-neutral-900 group-hover:text-[#1E4ED8]">{item.label}</span>
                <span className="mt-0.5 block text-[13px] text-neutral-500">{DESCRIPTIONS[item.href] ?? "Open section."}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <TalisBooksAdminHome />
      <TalisMapsAdminHome />
    </div>
  );
}
