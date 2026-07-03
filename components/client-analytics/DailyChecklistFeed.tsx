import type { ClientMarketingMetric } from "@/lib/client-marketing-service";
import { formatReportDateLong } from "@/lib/format-report-date";

interface DailyChecklistFeedProps {
  entries: ClientMarketingMetric[];
}

export default function DailyChecklistFeed({ entries }: DailyChecklistFeedProps) {
  const withNotes = entries.filter((entry) => entry.checklistNotes?.trim());

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Daily Checklist Updates
      </h2>
      {withNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">
            No checklist updates yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {withNotes.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              <p className="text-xs font-medium text-neutral-400 mb-2">
                {formatReportDateLong(entry.reportDate)}
              </p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {entry.checklistNotes}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
