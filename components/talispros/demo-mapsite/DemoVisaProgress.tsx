"use client";

import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";

export type DemoVisaProgressProps = {
  /** Primary stage label, e.g. "Optimizing pages…" */
  label: string;
  /** Secondary context under the bar, e.g. "Page 10 of 15" */
  detail?: string;
  /** Completed units; ignored when total is 0 (indeterminate). */
  current: number;
  /** Total units. Pass 0 for an indeterminate pulse (e.g. building). */
  total: number;
};

/**
 * Visa-style slim progress track for demo Talisbook™ create flow.
 * Uses TalisU navbar blue (TALISU_MKTS_HEADER_BLUE / #046BD9).
 */
export function DemoVisaProgress({
  label,
  detail,
  current,
  total,
}: DemoVisaProgressProps) {
  const determinate = total > 0;
  const percent = determinate
    ? Math.max(0, Math.min(100, Math.round((current / total) * 100)))
    : 0;
  const fillWidth = determinate
    ? `${Math.max(percent, percent > 0 ? 2 : 0)}%`
    : "32%";

  return (
    <div
      className="demo-visa-progress rounded-2xl border border-black/[0.05] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
      role="status"
      aria-live="polite"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? percent : undefined}
      aria-valuetext={
        determinate
          ? `${label} ${percent}%${detail ? ` — ${detail}` : ""}`
          : label
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-[13px] font-semibold tracking-tight text-neutral-950">
          {label}
        </p>
        {determinate ? (
          <p
            className="shrink-0 text-[13px] font-semibold tabular-nums"
            style={{ color: TALISU_MKTS_HEADER_BLUE }}
          >
            {percent}%
          </p>
        ) : (
          <p
            className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: TALISU_MKTS_HEADER_BLUE }}
          >
            In progress
          </p>
        )}
      </div>

      <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className={
            determinate
              ? "h-full rounded-full transition-[width] duration-500 ease-out"
              : "demo-visa-progress__indeterminate h-full rounded-full"
          }
          style={{
            width: fillWidth,
            backgroundColor: TALISU_MKTS_HEADER_BLUE,
          }}
        />
      </div>

      {detail ? (
        <p className="mt-2 text-[12px] leading-snug text-neutral-500">{detail}</p>
      ) : null}
    </div>
  );
}
