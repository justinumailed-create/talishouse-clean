"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  AdminTalisbotComment,
  AdminTalisbotMessage,
  Locale,
} from "@/lib/talispros/admin-talisbot-messages-types";
import { groupMessagesByIstDay, localizedMessage } from "@/lib/talispros/admin-talisbot-messages-shared";
import {
  markTalisbotMessageReadAction,
  postTalisbotCommentAction,
} from "@/app/admin/dashboard/talisbot-messages-actions";
import { cardClass } from "@/components/admin/ui";
import InlineLeadReview from "@/components/admin/InlineLeadReview";
import { istDay } from "@/lib/talispros/fast-code-tracker";
import type { ApprovalLead } from "@/lib/talispros/prospect-approval";

const COPY = {
  en: {
    kicker: "TalisBOT™",
    title: "Messages for you, Ralf",
    subtitle: "Full history stays here. Dismiss marks a message read — nothing is deleted.",
    needsReview: "Needs your review",
    dismiss: "Dismiss",
    reply: "Comment",
    send: "Send",
    sending: "Sending…",
    empty: "No TalisBOT™ messages yet.",
    from: "From",
    searching: "TalisBOT™ is searching…",
    searchingHint: "Checking independent brokerages in the next markets. This card updates when the run finishes.",
    history: "History",
    filterDate: "Date",
    allDates: "All dates",
    apply: "Show",
    general: "Message TalisBOT™",
    generalHint: "Ask TalisBOT™ anything about sourcing. Replies appear here.",
    statusNew: "New",
    statusSeen: "Seen",
    statusAnswered: "Answered",
    comments: "Comments",
    noComments: "No comments yet.",
    reviewToday: (n: number) => `Review today's ${n} leads`,
    handled: (n: number) => `Handled (${n})`,
  },
  de: {
    kicker: "TalisBOT™",
    title: "Nachrichten für Sie, Ralf",
    subtitle: "Der gesamte Verlauf bleibt erhalten. Verwerfen markiert nur als gelesen — nichts wird gelöscht.",
    needsReview: "Bitte prüfen",
    dismiss: "Verwerfen",
    reply: "Kommentar",
    send: "Senden",
    sending: "Sendet …",
    empty: "Noch keine TalisBOT™-Nachrichten.",
    from: "Von",
    searching: "TalisBOT™ sucht …",
    searchingHint: "Prüft unabhängige Maklerbüros in den nächsten Märkten. Diese Karte aktualisiert sich, wenn der Lauf fertig ist.",
    history: "Verlauf",
    filterDate: "Datum",
    allDates: "Alle Tage",
    apply: "Anzeigen",
    general: "Nachricht an TalisBOT™",
    generalHint: "Fragen Sie TalisBOT™ alles zur Recherche. Antworten erscheinen hier.",
    statusNew: "Neu",
    statusSeen: "Gesehen",
    statusAnswered: "Beantwortet",
    comments: "Kommentare",
    noComments: "Noch keine Kommentare.",
    reviewToday: (n: number) => `Heute ${n} Leads prüfen`,
    handled: (n: number) => `Erledigt (${n})`,
  },
} as const;

function fmt(iso: string, locale: Locale): string {
  return (
    new Date(iso).toLocaleString(locale === "de" ? "de-DE" : "en-CA", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " IST"
  );
}

function dayLabel(day: string, locale: Locale): string {
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString(locale === "de" ? "de-DE" : "en-CA", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function linkFor(m: AdminTalisbotMessage): { href: string; label: string } | null {
  if (m.fastCode) {
    return {
      href: `/admin/dashboard?code=${encodeURIComponent(m.fastCode)}#fast-codes-tracker`,
      label: m.fastCode.toUpperCase(),
    };
  }
  if (m.brokerage) {
    return { href: "/admin/dashboard#leads-to-approve", label: m.brokerage };
  }
  return null;
}

export type TalisbotPanelProps = {
  locale: Locale;
  messages: AdminTalisbotMessage[];
  comments: AdminTalisbotComment[];
  searching: boolean;
  dayFilter?: string | null;
  /** Preview-only seed (screenshots); does not write to the DB. */
  preview?: boolean;
  leadsByQueueId?: Record<string, ApprovalLead>;
  preserve?: Record<string, string>;
};

export default function TalisbotMessagesPanel({
  locale,
  messages,
  comments,
  searching,
  dayFilter = null,
  preview = false,
  leadsByQueueId = {},
  preserve = {},
}: TalisbotPanelProps) {
  const t = COPY[locale];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [general, setGeneral] = useState("");
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!searching) return;
    const id = window.setInterval(() => setPulse((n) => n + 1), 700);
    return () => window.clearInterval(id);
  }, [searching]);

  useEffect(() => {
    if (!searching || preview) return;
    const id = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(id);
  }, [searching, preview, router]);

  const openGroups = useMemo(() => groupMessagesByIstDay(messages.filter((m) => !m.readAt)), [messages]);
  const handled = useMemo(() => messages.filter((m) => m.readAt), [messages]);
  const commentsByMessage = useMemo(() => {
    const map = new Map<string, AdminTalisbotComment[]>();
    const generalList: AdminTalisbotComment[] = [];
    for (const c of comments) {
      if (!c.messageId) {
        generalList.push(c);
        continue;
      }
      const list = map.get(c.messageId) ?? [];
      list.push(c);
      map.set(c.messageId, list);
    }
    return { map, generalList };
  }, [comments]);

  function statusLabel(s: AdminTalisbotComment["status"]) {
    if (s === "answered") return t.statusAnswered;
    if (s === "seen") return t.statusSeen;
    return t.statusNew;
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`} data-testid="talisbot-messages" id="talisbot-messages" data-searching={searching ? "1" : "0"}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{t.kicker}</p>
          <h2 className="text-lg font-semibold text-neutral-900">{t.title}</h2>
          <p className="text-sm text-neutral-500">{t.subtitle}</p>
        </div>
        <form method="get" action="/admin/dashboard" className="flex flex-wrap items-end gap-2">
          {Object.entries(preserve).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <label className="flex flex-col text-xs font-medium text-neutral-600">
            {t.filterDate}
            <input
              type="date"
              name="talisbotDay"
              defaultValue={dayFilter && dayFilter !== "all" ? dayFilter : ""}
              className="mt-1 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm"
              data-testid="talisbot-day-filter"
            />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-[#1E4ED8] px-3 text-xs font-semibold text-white">
            {t.apply}
          </button>
          {dayFilter ? (
            <Link href="/admin/dashboard#talisbot-messages" className="h-9 rounded-lg border border-neutral-300 px-3 text-xs leading-9 text-neutral-700">
              {t.allDates}
            </Link>
          ) : null}
        </form>
      </div>

      {searching ? (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-[#1E4ED8]/40 bg-[#1E4ED8]/10 px-4 py-3"
          data-testid="talisbot-searching"
        >
          <span
            className="inline-flex h-3 w-3 rounded-full bg-[#1E4ED8]"
            style={{ opacity: pulse % 2 === 0 ? 1 : 0.35, transition: "opacity 0.35s" }}
            aria-hidden
          />
          <span>
            <p className="m-0 text-sm font-semibold text-[#1E4ED8]">{t.searching}</p>
            <p className="m-0 text-xs text-neutral-600">{t.searchingHint}</p>
          </span>
        </div>
      ) : null}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">{t.history}</p>
      {!messages.length ? (
        <p className="text-sm text-neutral-500">{t.empty}</p>
      ) : (
        <div className="space-y-5">
          {openGroups.map((g) => (
            <div key={g.day}>
              <p className="mb-2 text-xs font-semibold text-neutral-500">{dayLabel(g.day, locale)}</p>
              <ul className="m-0 list-none space-y-3 p-0">
                {g.items.map((m) => {
                  const needs = m.type === "needs_review";
                  const link = linkFor(m);
                  const unread = !m.readAt;
                  const loc = localizedMessage(m, locale);
                  const thread = commentsByMessage.map.get(m.id) ?? [];
                  return (
                    <li
                      key={m.id}
                      data-testid={needs ? "talisbot-needs-review" : "talisbot-message"}
                      className={`rounded-xl border px-4 py-3 ${
                        needs
                          ? "border-amber-400 bg-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
                          : unread
                            ? "border-[#1E4ED8]/30 bg-[#1E4ED8]/5"
                            : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="m-0 text-sm font-semibold text-neutral-900">{loc.title}</p>
                            {needs ? (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                {t.needsReview}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700">
                              {m.type}
                            </span>
                          </div>
                          <p className="m-0 text-xs text-neutral-500">
                            {fmt(m.createdAt, locale)} · {t.from}{" "}
                            {m.createdBy === "talisbot" || m.createdBy === "tsplits-sourcing"
                              ? "TalisBOT™"
                              : m.createdBy}
                            {link ? (
                              <>
                                {" · "}
                                <Link href={link.href} className="font-semibold text-[#1E4ED8] underline">
                                  {link.label}
                                </Link>
                              </>
                            ) : null}
                          </p>
                          <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800">{loc.body}</p>
                          {m.type === "result" && typeof m.metadata.jobRunId === "string" ? (
                            <Link
                              href={`/admin/dashboard?leadRun=${encodeURIComponent(m.metadata.jobRunId)}&leadAdded=${istDay(m.createdAt)}#leads-to-approve`}
                              className="inline-block text-sm font-semibold text-[#1E4ED8] underline"
                              data-testid="talisbot-review-today"
                            >
                              {t.reviewToday(typeof m.metadata.added === "number" ? m.metadata.added : 0)}
                            </Link>
                          ) : null}
                          {needs && m.prospectQueueId && leadsByQueueId[m.prospectQueueId] ? (
                            <InlineLeadReview
                              locale={locale}
                              lead={leadsByQueueId[m.prospectQueueId]!}
                              messageId={m.id}
                              preview={preview}
                            />
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {unread && !preview ? (
                            <button
                              type="button"
                              disabled={pending}
                              className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-800 hover:bg-white disabled:opacity-50"
                              onClick={() =>
                                start(async () => {
                                  await markTalisbotMessageReadAction(m.id);
                                  router.refresh();
                                })
                              }
                            >
                              {t.dismiss}
                            </button>
                          ) : null}
                          {!preview ? (
                            <button
                              type="button"
                              className="text-xs font-semibold text-[#1E4ED8] underline"
                              onClick={() => {
                                setReplyFor(replyFor === m.id ? null : m.id);
                                setDraft("");
                              }}
                            >
                              {t.reply}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {thread.length ? (
                        <div className="mt-3 space-y-2 border-t border-neutral-200/80 pt-2" data-testid="talisbot-comment-thread">
                          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{t.comments}</p>
                          {thread.map((c) => (
                            <div key={c.id} className="rounded-lg bg-white/80 px-3 py-2 text-sm">
                              <p className="m-0 text-xs text-neutral-500">
                                {c.author} · {fmt(c.createdAt, locale)} ·{" "}
                                <span className="font-semibold">{statusLabel(c.status)}</span>
                              </p>
                              <p className="m-0 whitespace-pre-wrap text-neutral-800">{c.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {replyFor === m.id ? (
                        <form
                          className="mt-3 flex flex-col gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (preview) return;
                            const fd = new FormData();
                            fd.set("message_id", m.id);
                            fd.set("body", draft);
                            start(async () => {
                              const res = await postTalisbotCommentAction(fd);
                              if (res.ok) {
                                setReplyFor(null);
                                setDraft("");
                                router.refresh();
                              }
                            });
                          }}
                        >
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={3}
                            required
                            className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <button
                            type="submit"
                            disabled={pending || !draft.trim()}
                            className="h-8 w-fit rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {pending ? t.sending : t.send}
                          </button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {handled.length ? (
        <details className="mt-4 rounded-xl border border-neutral-200 px-4 py-3" data-testid="talisbot-handled">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-700">{t.handled(handled.length)}</summary>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {handled.map((m) => {
              const loc = localizedMessage(m, locale);
              return (
                <li key={m.id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700" data-testid="talisbot-message">
                  <p className="m-0 font-semibold text-neutral-900">{loc.title}</p>
                  <p className="m-0 text-xs text-neutral-500">{fmt(m.createdAt, locale)}</p>
                  <p className="m-0 mt-1 whitespace-pre-wrap">{loc.body}</p>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      <div className="mt-5 rounded-xl border border-dashed border-neutral-300 p-4" data-testid="talisbot-general-box">
        <p className="m-0 text-sm font-semibold text-neutral-900">{t.general}</p>
        <p className="mt-1 text-xs text-neutral-500">{t.generalHint}</p>
        {commentsByMessage.generalList.length ? (
          <ul className="mt-2 list-none space-y-2 p-0">
            {commentsByMessage.generalList.map((c) => (
              <li key={c.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <p className="m-0 text-xs text-neutral-500">
                  {c.author} · {fmt(c.createdAt, locale)} · <span className="font-semibold">{statusLabel(c.status)}</span>
                </p>
                <p className="m-0 whitespace-pre-wrap text-neutral-800">{c.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-neutral-400">{t.noComments}</p>
        )}
        {!preview ? (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData();
              fd.set("body", general);
              start(async () => {
                const res = await postTalisbotCommentAction(fd);
                if (res.ok) {
                  setGeneral("");
                  router.refresh();
                }
              });
            }}
          >
            <textarea
              value={general}
              onChange={(e) => setGeneral(e.target.value)}
              rows={2}
              required
              className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              placeholder={t.general}
            />
            <button
              type="submit"
              disabled={pending || !general.trim()}
              className="h-8 w-fit rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? t.sending : t.send}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
