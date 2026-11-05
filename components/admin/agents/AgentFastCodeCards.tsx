"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFastCodeNoteAction, setFastCodeStageAction } from "@/app/admin/agent/fast-code-actions";
import { FAST_CODE_STAGES, FAST_CODE_STAGE_LABELS, type FastCodeStage } from "@/lib/talispros/fast-code-tracker";

export interface AgentFastCodeCard {
  fastCode: string;
  brokerage: string;
  contact: string | null;
  address: string | null;
  stage: FastCodeStage;
  mapsiteHref: string;
  tebHref: string;
  lastNote: string | null;
  lastUpdate: string | null;
}

const COPY = {
  en: {
    title: "My FAST Codes",
    subtitle: "One card per prospect. Set the stage after each call and add a short note.",
    contact: "Contact",
    stage: "Stage",
    openMapsite: "Open Mapsite",
    openTeb: "Open TEB™",
    note: "Add note",
    notePlaceholder: "What happened today?",
    save: "Save note",
    saving: "Saving…",
    saved: "Saved",
    last: "Last update",
    empty: "No FAST Codes are assigned to you yet.",
    failed: "That did not work. Please try again.",
    readOnly: "Read-only preview",
  },
  de: {
    title: "Meine FAST Codes",
    subtitle: "Eine Karte pro Interessent. Phase nach jedem Gespräch setzen und kurz notieren.",
    contact: "Kontakt",
    stage: "Phase",
    openMapsite: "Mapsite öffnen",
    openTeb: "TEB™ öffnen",
    note: "Notiz hinzufügen",
    notePlaceholder: "Was ist heute passiert?",
    save: "Notiz speichern",
    saving: "Wird gespeichert …",
    saved: "Gespeichert",
    last: "Letzte Aktualisierung",
    empty: "Ihnen sind noch keine FAST Codes zugewiesen.",
    failed: "Das hat nicht geklappt. Bitte versuchen Sie es erneut.",
    readOnly: "Nur-Lese-Vorschau",
  },
} as const;

function Card({ card, locale, readOnly }: { card: AgentFastCodeCard; locale: "en" | "de"; readOnly: boolean }) {
  const t = COPY[locale];
  const router = useRouter();
  const [stage, setStage] = useState<FastCodeStage>(card.stage);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const last = card.lastUpdate
    ? new Date(card.lastUpdate).toLocaleString(locale === "de" ? "de-DE" : "en-CA", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " IST"
    : null;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" data-testid="agent-fast-code-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-semibold uppercase tracking-wide text-[#1E4ED8]">{card.fastCode}</p>
          <h3 className="truncate text-[16px] font-semibold text-neutral-900">{card.brokerage}</h3>
          {card.contact ? (
            <p className="text-[13px] text-neutral-600">
              {t.contact}: {card.contact}
            </p>
          ) : null}
          {card.address ? <p className="truncate text-[12px] text-neutral-500">{card.address}</p> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={card.mapsiteHref} target="_blank" rel="noreferrer" className="rounded-lg bg-[#1E4ED8] px-3 py-1.5 text-xs font-semibold text-white">
          {t.openMapsite}
        </a>
        <a href={card.tebHref} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
          {t.openTeb}
        </a>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-medium text-neutral-600">
        {t.stage}
        <select
          value={stage}
          disabled={readOnly || pending}
          data-testid="agent-fast-code-stage"
          onChange={(e) => {
            const next = e.target.value as FastCodeStage;
            const prev = stage;
            setStage(next);
            setMsg(null);
            start(async () => {
              const res = await setFastCodeStageAction({ code: card.fastCode, stage: next });
              if (!res.ok) {
                setStage(prev);
                setMsg(t.failed);
              } else {
                setMsg(t.saved);
                router.refresh();
              }
            });
          }}
          className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-[14px] text-neutral-900"
        >
          {FAST_CODE_STAGES.map((s) => (
            <option key={s} value={s}>
              {FAST_CODE_STAGE_LABELS[locale][s]}
            </option>
          ))}
        </select>
      </label>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = note.trim();
          if (!value || readOnly) return;
          setMsg(null);
          start(async () => {
            const res = await addFastCodeNoteAction({ code: card.fastCode, note: value });
            if (res.ok) {
              setNote("");
              setMsg(t.saved);
              router.refresh();
            } else setMsg(t.failed);
          });
        }}
      >
        <label className="sr-only" htmlFor={`note-${card.fastCode}`}>
          {t.note}
        </label>
        <textarea
          id={`note-${card.fastCode}`}
          rows={2}
          value={note}
          disabled={readOnly}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-[14px] text-neutral-900 outline-none focus:border-[#1E4ED8]"
          data-testid="agent-fast-code-note"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-neutral-500">{msg ?? (last ? `${t.last}: ${last}` : "")}</span>
          <button
            type="submit"
            disabled={readOnly || pending || !note.trim()}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
          >
            {pending ? t.saving : t.note}
          </button>
        </div>
        {card.lastNote ? <p className="m-0 line-clamp-2 text-[12px] italic text-neutral-500">“{card.lastNote}”</p> : null}
      </form>
    </li>
  );
}

export default function AgentFastCodeCards({
  cards,
  locale,
  readOnly = false,
}: {
  cards: AgentFastCodeCard[];
  locale: "en" | "de";
  readOnly?: boolean;
}) {
  const t = COPY[locale];
  return (
    <section data-testid="agent-fast-code-slots">
      <div className="mb-3">
        <h2 className="text-[17px] font-semibold text-neutral-900">{t.title}</h2>
        <p className="text-sm text-neutral-500">{readOnly ? t.readOnly : t.subtitle}</p>
      </div>
      {cards.length ? (
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.fastCode} card={c} locale={locale} readOnly={readOnly} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">{t.empty}</p>
      )}
    </section>
  );
}
