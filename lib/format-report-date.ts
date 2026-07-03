const REPORT_DATE_LOCALE = "en-US";

export function formatReportDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(
    REPORT_DATE_LOCALE,
    options
  );
}

export function formatReportDateShort(dateStr: string): string {
  return formatReportDate(dateStr, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatReportDateNumeric(dateStr: string): string {
  return formatReportDate(dateStr, {
    month: "numeric",
    day: "numeric",
  });
}

export function formatReportDateLong(dateStr: string): string {
  return formatReportDate(dateStr, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
