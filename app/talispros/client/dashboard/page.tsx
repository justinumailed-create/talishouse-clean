import ClientSignOutButton from "@/app/talispros/client/ClientSignOutButton";
import DailyChecklistFeed from "@/components/client-analytics/DailyChecklistFeed";
import MetricsOverview from "@/components/client-analytics/MetricsOverview";
import WeeklyReportsList from "@/components/client-analytics/WeeklyReportsList";
import { requireClientAnalyticsSession } from "@/lib/client-analytics-auth";
import { getClientDashboardContext } from "@/lib/client-marketing-service";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await requireClientAnalyticsSession();
  const context = await getClientDashboardContext(
    session.fastCode,
    session.displayName
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              TalisPros™
            </p>
            <h1 className="text-sm font-semibold text-neutral-900">
              Client Analytics
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500 hidden sm:inline">
              {session.displayName} ·{" "}
              <span className="font-mono">{session.fastCode.toUpperCase()}</span>
            </span>
            <ClientSignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Marketing Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {context.propertyTitle ?? context.ownerName}
            {context.agentName ? ` · Managed by ${context.agentName}` : ""}
          </p>
        </div>

        <MetricsOverview
          metrics={context.latestMetrics}
          history={context.recentMetricsHistory}
        />
        <WeeklyReportsList reports={context.weeklyReports} />
        <DailyChecklistFeed entries={context.recentChecklists} />
      </div>
    </div>
  );
}
