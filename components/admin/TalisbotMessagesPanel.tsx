"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminTalisbotMessage } from "@/lib/talispros/admin-talisbot-messages";
import {
  markTalisbotMessageReadAction,
  replyTalisbotMessageAction,
} from "@/app/admin/dashboard/talisbot-messages-actions";
import { cardClass } from "@/components/admin/ui";

type Locale = "en" | "de";

const COPY = {
  en: {
    kicker: "TalisBOT™",
    title: "Messages for you",
    subtitle: "Full history stays here. Dismiss marks a message read — nothing is deleted.",
    needsReview: "Needs your review",
    dismiss: "Dismiss",
    reply: "Reply",
    send: "Send reply",
    sending: "Sending…",
    empty: "No TalisBOT™ messages yet.",
    from: "From",
  },
  de: {
    kicker: "TalisBOT™",
    title: "Nachrichten für Sie",
    subtitle: "Der gesamte Verlauf bleibt erhalten. Verwerfen markiert nur als gelesen — nichts wird gelöscht.",
    needsReview: "Bitte prüfen",
    dismiss: "Verwerfen",
    reply: "Antworten",
    send: "Antwort senden",
    sending: "Sendet …",
    empty: "Noch keine TalisBOT™-Nachrichten.",
    from: "Von",
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

function linkFor(m: AdminTalisbotMessage): { href: string; label: string } | null {
  if (m.fastCode) {
    return {
      href: `/admin/dashboard?code=${encodeURIComponent(m.fastCode)}#fast-codes-tracker`,
      label: m.fastCode.toUpperCase(),
    };
  }
  if (m.brokerage) {
    return { href: "/admin/dashboard#prospect-queue", label: m.brokerage };
  }
  return null;
}

export default function TalisbotMessagesPanel({
  locale,
  messages,
}: {
  locale: Locale;
  messages: AdminTalisbotMessage[];
}) {
  const t = COPY[locale];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (!messages.length) {
    return (
      <section className={`${cardClass} p-5 sm:p-6`} data-testid="talisbot-messages">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{t.kicker}</p>
        <h2 className="text-lg font-semibold text-neutral-900">{t.title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t.empty}</p>
      </section>
    );
  }

  return (
    <section className={`${cardClass} p-5 sm:p-6`} data-testid="talisbot-messages" id="talisbot-messages">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{t.kicker}</p>
        <h2 className="text-lg font-semibold text-neutral-900">{t.title}</h2>
        <p className="text-sm text-neutral-500">{t.subtitle}</p>
      </div>
      <ul className="m-0 list-none space-y-3 p-0">
        {messages.map((m) => {
          const needs = m.type === "needs_review";
          const link = linkFor(m);
          const unread = !m.readAt;
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
                    <p className="m-0 text-sm font-semibold text-neutral-900">{m.title}</p>
                    {needs ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {t.needsReview}
                      </span>
                    ) : null}
                    {unread && !needs ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="m-0 text-xs text-neutral-500">
                    {fmt(m.createdAt, locale)} · {t.from} {m.createdBy === "talisbot" ? "TalisBOT™" : m.createdBy}
                    {link ? (
                      <>
                        {" · "}
                        <Link href={link.href} className="font-semibold text-[#1E4ED8] underline">
                          {link.label}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800">{m.body}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {unread ? (
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
                  {m.type !== "reply" ? (
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
              {replyFor === m.id ? (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData();
                    fd.set("parent_id", m.id);
                    fd.set("body", draft);
                    start(async () => {
                      const res = await replyTalisbotMessageAction(fd);
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
    </section>
  );
}
