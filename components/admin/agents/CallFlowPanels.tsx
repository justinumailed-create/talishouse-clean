import Link from "next/link";
import { CHECKPOINT_LABEL, stepLabel, type FlowLocale, type FlowUi } from "@/lib/talispros/call-flow-copy";
import type { BoardCard, LeaderRow } from "@/lib/talispros/call-flow-server";
import type { BadgeKey } from "@/lib/talispros/call-flow";
import { FAST_CODE_STAGE_LABELS } from "@/lib/talispros/fast-code-tracker";

const card = "rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

function badgeText(ui: FlowUi, key: BadgeKey): string {
  if (key === "first_call") return ui.first_call;
  if (key === "first_demo") return ui.first_demo;
  return ui.first_registration;
}

export function Leaderboard({ rows, ui }: { rows: LeaderRow[]; ui: FlowUi }) {
  const max = Math.max(1, ...rows.map((row) => row.points));
  return (
    <section className={`${card} p-5`} data-testid="leaderboard">
      <h2 className="text-[15px] font-semibold text-neutral-900">{ui.board}</h2>
      <p className="mt-1 text-[13px] text-neutral-500">{ui.boardHint}</p>
      <ol className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <li key={row.loginId} className="rounded-xl border border-neutral-200 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">
                {index + 1}. {row.name}
              </p>
              <p className="text-sm font-semibold text-[#1E4ED8]">
                {row.points} {ui.points}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-[#1E4ED8]" style={{ width: `${Math.round((row.points / max) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              {row.streak} {ui.streak}
              {row.badges.length ? ` · ${row.badges.map((key) => badgeText(ui, key)).join(" · ")}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AssignedMapsites({
  cards,
  ui,
  locale,
  hrefFor,
}: {
  cards: BoardCard[];
  ui: FlowUi;
  locale: FlowLocale;
  hrefFor: (fastCode: string) => string;
}) {
  return (
    <section data-testid="agent-lead-list">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{ui.assigned}</h2>
      <p className="mt-1 text-sm text-neutral-500">{ui.assignedHint}</p>
      {cards.length === 0 ? <p className="mt-3 text-sm text-neutral-500">{ui.empty}</p> : null}
      <ol className="mt-4 space-y-3">
        {cards.map((item) => (
          <li key={item.fastCode} className={`${card} p-4`} data-testid="agent-fast-code-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[12px] font-semibold uppercase tracking-wide text-[#1E4ED8]">{item.fastCode}</p>
                <Link href={hrefFor(item.fastCode)} className="block text-[16px] font-semibold text-neutral-900 underline-offset-2 hover:underline">
                  {item.brokerage}
                </Link>
                {item.contact ? (
                  <Link href={hrefFor(item.fastCode)} className="mt-0.5 block text-[13px] text-neutral-600 hover:text-[#1E4ED8]">
                    {ui.contact}: {item.contact}
                  </Link>
                ) : null}
                {item.town ? <p className="text-[12px] text-neutral-500">{item.town}</p> : null}
                {item.phone ? (
                  <Link href={hrefFor(item.fastCode)} className="block text-[13px] text-neutral-700 hover:text-[#1E4ED8]">
                    {item.phone}
                  </Link>
                ) : null}
                {item.email ? (
                  <Link href={hrefFor(item.fastCode)} className="block truncate text-[13px] text-neutral-700 hover:text-[#1E4ED8]">
                    {item.email}
                  </Link>
                ) : null}
              </div>
              <span className="rounded-full bg-[#1E4ED8]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1E4ED8]">
                {FAST_CODE_STAGE_LABELS[locale][item.stage]}
              </span>
            </div>
            <p className="mt-3 text-[13px] text-neutral-700">
              {ui.next}: {stepLabel(item.next, locale)}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
              <div className="h-full rounded-full bg-[#1E4ED8]" style={{ width: `${item.progress}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-neutral-500">
              {ui.progress} {item.progress}% · {item.points} {ui.points}
              {item.checkpoint ? ` · ${ui.checkpoint}: ${CHECKPOINT_LABEL[locale][item.checkpoint]}` : ""}
              {item.commentCount ? ` · ${item.commentCount} ${ui.comments}` : ""}
            </p>
            {item.agentName ? <p className="mt-1 text-[12px] text-neutral-500">{item.agentName}</p> : null}
            <Link href={hrefFor(item.fastCode)} className="mt-3 inline-flex text-[13px] font-semibold text-[#1E4ED8]">
              {ui.open}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
