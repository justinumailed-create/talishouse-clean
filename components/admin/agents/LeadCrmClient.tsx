"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { saveCheckpointCommentAction, saveLeadAction, saveStepAction } from "@/app/admin/agent/flow-actions";
import { LEAD_POSITIONS } from "@/lib/crm-leads/model";
import { CHECKPOINT_LABEL, type FlowLocale, type FlowUi } from "@/lib/talispros/call-flow-copy";
import type { CheckpointKey } from "@/lib/talispros/call-flow";
import type { LeadBundle } from "@/lib/talispros/call-flow-server";
import { FAST_CODE_STAGE_LABELS } from "@/lib/talispros/fast-code-tracker";
import DisqualifyBrokerageControl from "./DisqualifyBrokerageControl";
import { fieldClass, primaryButton, secondaryButton, textareaClass } from "./ui";

const POS: Record<FlowLocale, Record<string, string>> = {
  en: { broker: "Broker", acting_broker: "Acting broker", managing_broker: "Managing broker", team_leader: "Team leader" },
  de: { broker: "Makler", acting_broker: "Stellvertretender Makler", managing_broker: "Geschäftsführender Makler", team_leader: "Teamleiter" },
};

function when(iso: string, locale: FlowLocale): string {
  return (
    new Date(iso).toLocaleString(locale === "de" ? "de-DE" : "en-CA", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) + " IST"
  );
}

export default function LeadCrmClient({ bundle, ui, locale }: { bundle: LeadBundle; ui: FlowUi; locale: FlowLocale }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [lead, setLead] = useState(bundle.lead);
  const set = (key: keyof typeof lead) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setLead((current) => ({ ...current, [key]: event.target.value }));

  const saveLead = () => {
    setMsg(null);
    start(async () => {
      const res = await saveLeadAction({ code: bundle.fastCode, ...lead });
      setMsg(res.ok ? ui.saved : ui.failed);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-6" data-testid="lead-crm">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{ui.crmKicker}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{lead.brokerageName}</h1>
        <p className="mt-1 font-mono text-sm text-[#1E4ED8]">{bundle.fastCode}</p>
        <p className="mt-2 text-sm text-neutral-600">
          {FAST_CODE_STAGE_LABELS[locale][bundle.stage]} · {ui.noDelete}
        </p>
        {!bundle.canEdit ? <p className="mt-2 text-sm text-neutral-600">{ui.reviewerNote}</p> : null}
        {bundle.disqualification ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950" data-testid="lead-disqualified">
            {locale === "de"
              ? `Disqualifiziert von ${bundle.disqualification.actorName}. ${bundle.disqualification.reason}`
              : `Disqualified by ${bundle.disqualification.actorName}. ${bundle.disqualification.reason}`}
          </p>
        ) : null}
        {bundle.disqualification && bundle.canReverse ? (
          <DisqualifyBrokerageControl locale={locale} mode="restore" fastCode={bundle.fastCode} />
        ) : null}
        {!bundle.disqualification && bundle.canEdit ? (
          <DisqualifyBrokerageControl locale={locale} fastCode={bundle.fastCode} />
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={bundle.mapsiteHref} target="_blank" rel="noreferrer" className={primaryButton}>
            {ui.mapsite}
          </a>
          <a href={bundle.tebHref} target="_blank" rel="noreferrer" className={secondaryButton}>
            {ui.teb}
          </a>
          <a href={bundle.registerUrl} target="_blank" rel="noreferrer" className={secondaryButton}>
            {ui.registerLink}
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (bundle.canEdit) saveLead();
          }}
        >
          <Field label={ui.brokerage} value={lead.brokerageName} onChange={set("brokerageName")} disabled={!bundle.canEdit} />
          <Field label={ui.decision} value={lead.decisionMakerName} onChange={set("decisionMakerName")} disabled={!bundle.canEdit} />
          <label className="block text-[13px] font-medium text-neutral-700">
            {ui.position}
            <select className={`${fieldClass} mt-1`} value={lead.position} onChange={set("position")} disabled={!bundle.canEdit}>
              {LEAD_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {POS[locale][position]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ui.cell} value={lead.cellPhone} onChange={set("cellPhone")} disabled={!bundle.canEdit} />
            <Field label={ui.office} value={lead.officePhone} onChange={set("officePhone")} disabled={!bundle.canEdit} />
          </div>
          <Field label={ui.email} value={lead.email} onChange={set("email")} disabled={!bundle.canEdit} type="email" />
          <Field label={ui.address} value={lead.brokerageAddress} onChange={set("brokerageAddress")} disabled={!bundle.canEdit} />
          <Field label={ui.website} value={lead.brokerageWebsite} onChange={set("brokerageWebsite")} disabled={!bundle.canEdit} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={ui.town} value={lead.town} onChange={set("town")} disabled={!bundle.canEdit} />
            <Field label={ui.agentCount} value={lead.agentCount} onChange={set("agentCount")} disabled={!bundle.canEdit} inputMode="numeric" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[13px] font-medium text-neutral-700">
              {ui.country}
              <select className={`${fieldClass} mt-1`} value={lead.country} onChange={set("country")} disabled={!bundle.canEdit}>
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
              </select>
            </label>
            <Field label={ui.market} value={lead.market} onChange={set("market")} disabled={!bundle.canEdit} />
          </div>
          <Field label={ui.source} value={lead.source} onChange={set("source")} disabled={!bundle.canEdit} />
          <Field label={ui.fastCode} value={bundle.fastCode} onChange={() => undefined} disabled />
          <label className="block text-[13px] font-medium text-neutral-700">
            {ui.notes}
            <textarea className={`${textareaClass} mt-1`} rows={3} value={lead.notes} onChange={set("notes")} disabled={!bundle.canEdit} />
          </label>
          {bundle.canEdit ? (
            <button type="submit" className={primaryButton} disabled={pending}>
              {pending ? ui.saving : ui.saveLead}
            </button>
          ) : null}
          {msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
        </form>

        <div className="space-y-3">
          {bundle.steps.map((step) => (
            <article
              key={step.key}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
              data-testid={step.locked ? "call-step-locked" : "call-step-open"}
            >
              <h2 className="text-[15px] font-semibold text-neutral-900">{step.label}</h2>
              <p className="mt-1 text-[13px] text-neutral-600">
                <span className="font-semibold text-neutral-800">{ui.goal}. </span>
                {step.goal}
              </p>
              {step.locked ? <p className="mt-3 text-sm font-medium text-neutral-500">{ui.locked}</p> : null}
              {!step.locked ? (
                <>
                  <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-[#1E4ED8]">{ui.say}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900">{step.script}</p>
                  {step.points.length ? (
                    <ul className="mt-3 space-y-2">
                      {step.points.map((point) => (
                        <li key={point.bring} className="rounded-xl bg-neutral-50 p-3 text-[13px] text-neutral-700">
                          <p>
                            <span className="font-semibold">{ui.heard}: </span>
                            {point.heard}
                          </p>
                          <p className="mt-1">
                            <span className="font-semibold">{ui.bring}: </span>
                            {point.bring}
                          </p>
                          <p className="mt-1">{point.say}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {step.close ? <p className="mt-3 text-[15px] font-medium text-neutral-900">{step.close}</p> : null}
                  {step.objections.length ? (
                    <div className="mt-3">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">{ui.objections}</p>
                      <ul className="mt-2 space-y-2">
                        {step.objections.map((item) => (
                          <li key={item.title} className="text-[13px] text-neutral-700">
                            <p className="font-semibold text-neutral-900">{item.title}</p>
                            <p>{item.say}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {step.key === "register" ? (
                    <div className="mt-3 rounded-xl border border-[#1E4ED8]/30 bg-[#1E4ED8]/5 p-3">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#1E4ED8]">{ui.entry}</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-neutral-900">{bundle.entryCode || "—"}</p>
                      <p className="mt-1 text-[12px] text-neutral-600">{bundle.entryCode ? ui.entryHint : ui.entryMissing}</p>
                    </div>
                  ) : null}
                  {step.savedResponse ? (
                    <p className="mt-3 text-[13px] text-neutral-700">
                      <span className="font-semibold">{ui.savedOn}: </span>
                      {step.savedResponse}
                    </p>
                  ) : bundle.canEdit ? (
                    <StepForm code={bundle.fastCode} step={step.key} ui={ui} />
                  ) : null}
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5" data-testid="checkpoint-comments">
        <h2 className="text-[15px] font-semibold text-neutral-900">{ui.checkpoints}</h2>
        {bundle.checkpoints.length === 0 ? <p className="mt-2 text-sm text-neutral-500">{ui.checkpointWait}</p> : null}
        <div className="mt-3 space-y-4">
          {bundle.checkpoints.map((key) => (
            <CheckpointBlock key={key} code={bundle.fastCode} checkpoint={key} bundle={bundle} ui={ui} locale={locale} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-neutral-900">{ui.stageHistory}</h2>
        {bundle.history.length === 0 ? <p className="mt-2 text-sm text-neutral-500">{ui.historyEmpty}</p> : null}
        <ol className="mt-3 space-y-2">
          {bundle.history.map((item) => (
            <li key={item.id} className="text-[13px] text-neutral-700">
              <p className="font-medium text-neutral-900">{item.label}</p>
              <p className="text-neutral-500">{when(item.at, locale)}</p>
              {item.note ? <p className="whitespace-pre-wrap">{item.note}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  inputMode?: "numeric";
}) {
  return (
    <label className="block text-[13px] font-medium text-neutral-700">
      {label}
      <input className={`${fieldClass} mt-1`} value={value} onChange={onChange} disabled={disabled} type={type} inputMode={inputMode} />
    </label>
  );
}

function StepForm({ code, step, ui }: { code: string; step: string; ui: FlowUi }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const send = (outcome: "continue" | "not_interested") => {
    if (!text.trim()) {
      setMsg(ui.responseHint);
      return;
    }
    setMsg(null);
    start(async () => {
      const res = await saveStepAction({ code, step, outcome, response: text });
      if (!res.ok) setMsg(res.error === "locked" ? ui.locked : ui.failed);
      else {
        setText("");
        setMsg(ui.saved);
        router.refresh();
      }
    });
  };
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-[13px] font-medium text-neutral-700">
        {ui.response}
        <textarea className={`${textareaClass} mt-1`} rows={3} value={text} onChange={(event) => setText(event.target.value)} required />
      </label>
      <p className="text-[12px] text-neutral-500">{ui.responseHint}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryButton} disabled={pending} onClick={() => send("continue")}>
          {pending ? ui.saving : ui.saveResponse}
        </button>
        <button type="button" className={secondaryButton} disabled={pending} onClick={() => send("not_interested")}>
          {ui.notInterested}
        </button>
      </div>
      {msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
    </div>
  );
}

function CheckpointBlock({
  code,
  checkpoint,
  bundle,
  ui,
  locale,
}: {
  code: string;
  checkpoint: CheckpointKey;
  bundle: LeadBundle;
  ui: FlowUi;
  locale: FlowLocale;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const comments = bundle.comments.filter((item) => item.checkpoint === checkpoint);
  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <h3 className="text-sm font-semibold text-neutral-900">{CHECKPOINT_LABEL[locale][checkpoint]}</h3>
      {comments.length === 0 ? <p className="mt-2 text-[13px] text-neutral-500">{ui.noComments}</p> : null}
      <ul className="mt-2 space-y-2">
        {comments.map((item) => (
          <li key={item.id} className="text-[13px] text-neutral-700">
            <p className="font-semibold text-neutral-900">
              {item.authorName} · {when(item.createdAt, locale)}
            </p>
            <p className="whitespace-pre-wrap">{item.body}</p>
          </li>
        ))}
      </ul>
      {bundle.canComment ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            setMsg(null);
            start(async () => {
              const res = await saveCheckpointCommentAction({ code, checkpoint, body: text });
              if (!res.ok) setMsg(ui.failed);
              else {
                setText("");
                setMsg(ui.saved);
                router.refresh();
              }
            });
          }}
        >
          <label className="block text-[13px] font-medium text-neutral-700">
            {ui.comment}
            <textarea className={`${textareaClass} mt-1`} rows={2} value={text} onChange={(event) => setText(event.target.value)} required />
          </label>
          <p className="text-[12px] text-neutral-500">{ui.commentHint}</p>
          <button type="submit" className={secondaryButton} disabled={pending}>
            {pending ? ui.saving : ui.post}
          </button>
          {msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
