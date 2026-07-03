export interface DailyMetricInput {
  reportDate: string;
  facebookImpressions: number;
  instagramImpressions: number;
  totalReach: number;
  emailsReceived: number;
  textsReceived: number;
  pipelineStatus: string;
}

export interface WeeklyReportAggregate {
  weekStart: string;
  weekEnd: string;
  summaryText: string;
  facebookImpressionsTotal: number;
  instagramImpressionsTotal: number;
  totalReachTotal: number;
  emailsReceivedTotal: number;
  textsReceivedTotal: number;
  pipelineStatus: string;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPipelineStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function aggregateWeeklyReport(
  fastCode: string,
  weekStart: string,
  weekEnd: string,
  metrics: DailyMetricInput[]
): WeeklyReportAggregate {
  const totals = metrics.reduce(
    (acc, row) => ({
      facebookImpressionsTotal:
        acc.facebookImpressionsTotal + row.facebookImpressions,
      instagramImpressionsTotal:
        acc.instagramImpressionsTotal + row.instagramImpressions,
      totalReachTotal: acc.totalReachTotal + row.totalReach,
      emailsReceivedTotal: acc.emailsReceivedTotal + row.emailsReceived,
      textsReceivedTotal: acc.textsReceivedTotal + row.textsReceived,
    }),
    {
      facebookImpressionsTotal: 0,
      instagramImpressionsTotal: 0,
      totalReachTotal: 0,
      emailsReceivedTotal: 0,
      textsReceivedTotal: 0,
    }
  );

  const sorted = [...metrics].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
  const latestStatus =
    sorted.length > 0 ? sorted[sorted.length - 1].pipelineStatus : "active";

  const summaryText = [
    `Week of ${formatDateLabel(weekStart)} – ${formatDateLabel(weekEnd)} for ${fastCode.toUpperCase()}:`,
    `Facebook ${totals.facebookImpressionsTotal.toLocaleString()} impressions,`,
    `Instagram ${totals.instagramImpressionsTotal.toLocaleString()} impressions,`,
    `${totals.totalReachTotal.toLocaleString()} total reach,`,
    `${totals.emailsReceivedTotal} emails and ${totals.textsReceivedTotal} texts received.`,
    `Pipeline: ${formatPipelineStatus(latestStatus)}.`,
  ].join(" ");

  return {
    weekStart,
    weekEnd,
    summaryText,
    ...totals,
    pipelineStatus: latestStatus,
  };
}

export function getPreviousWeekRange(referenceDate = new Date()): {
  weekStart: string;
  weekEnd: string;
} {
  const end = new Date(referenceDate);
  end.setHours(12, 0, 0, 0);
  end.setDate(end.getDate() - 1);

  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

  return {
    weekStart: toIsoDate(start),
    weekEnd: toIsoDate(end),
  };
}
