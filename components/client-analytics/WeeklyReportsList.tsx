import type { ClientWeeklyReport } from "@/lib/client-marketing-service";
import { formatReportDate } from "@/lib/format-report-date";

interface WeeklyReportsListProps {
  reports: ClientWeeklyReport[];
}

function formatWeekRange(start: string, end: string): string {
  return `${formatReportDate(start, { month: "short", day: "numeric" })} – ${formatReportDate(end, { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function WeeklyReportsList({ reports }: WeeklyReportsListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Weekly Performance Summaries
      </h2>
      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">
            Weekly summaries are generated automatically every Monday.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                {formatWeekRange(report.weekStart, report.weekEnd)}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {report.summaryText}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
