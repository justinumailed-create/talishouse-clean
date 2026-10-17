"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import {
  addMapSitePartner,
  removeMapSitePartner,
  saveMapSiteCustomPinCategories,
  setMapSiteMainPinCategory,
} from "@/app/talispros/mapsite/partner-actions";
import {
  MANDATORY_PIN_CATEGORIES,
  MAX_CUSTOM_PIN_CATEGORIES,
  PIN_CATEGORY_LABEL_MAX,
  normalizeCustomPinCategories,
  pinCategoryOptions,
} from "@/lib/talispros/mapsite-pin-categories";
import { derivativeNeedsRoot } from "@/lib/talispros/mapsite-root-partners";
import type { MapSiteRootContext } from "@/lib/talispros/mapsite-root-partners-service";

type PanelProps = {
  mapsiteId: string;
  fastCode: string;
  context: MapSiteRootContext;
  onClose: () => void;
  onContextChange: (context: MapSiteRootContext) => void;
};

function PanelShell({
  title,
  fastCode,
  onClose,
  children,
  testId,
}: {
  title: string;
  fastCode: string;
  onClose: () => void;
  children: ReactNode;
  testId: string;
}) {
  const t = useT();
  const titleId = useId();
  return (
    <section
      role="dialog"
      aria-labelledby={titleId}
      data-testid={testId}
      className="pointer-events-auto absolute left-3 top-3 z-30 flex max-h-[min(calc(100%-1.5rem),44rem)] w-[min(calc(100%-1.5rem),22rem)] flex-col overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-xl ring-1 ring-black/5 sm:left-4 sm:top-4"
    >
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Mapsites
          </p>
          <h2 id={titleId} className="text-sm font-semibold">
            {title}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
            FAST Code™ {fastCode.trim().toUpperCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
        >
          {t.mapsite.close}
        </button>
      </header>
      <div className="space-y-4 overflow-y-auto px-4 py-3 text-sm">{children}</div>
    </section>
  );
}

function Notice({ error, message }: { error: string | null; message: string | null }) {
  return (
    <>
      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** Owner Dashboard → PIN Categories: main PIN category + up to five custom categories. */
export function MapSiteCategoryEditor({
  mapsiteId,
  fastCode,
  context,
  onClose,
  onContextChange,
}: PanelProps) {
  const t = useT();
  const locale = useLocale() === "de" ? "de" : "en";
  const c = t.mapsite.categoryEditor;
  const [draft, setDraft] = useState<string[]>(context.ownCustomCategories);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inherited = context.rootFastCode;
  const options = pinCategoryOptions(context.customCategories, locale);

  function addLabel() {
    const next = normalizeCustomPinCategories([...draft, newLabel]);
    if (next.length === draft.length) return;
    setDraft(next);
    setNewLabel("");
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMapSiteCustomPinCategories({ mapsiteId, fastCode, categories: draft });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("context" in result && result.context) {
        onContextChange(result.context);
        setDraft(result.context.ownCustomCategories);
      }
      setMessage(c.saved);
    });
  }

  function setMain(value: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await setMapSiteMainPinCategory({ mapsiteId, fastCode, category: value || null });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("context" in result && result.context) onContextChange(result.context);
      setMessage(c.saved);
    });
  }

  return (
    <PanelShell title={c.title} fastCode={fastCode} onClose={onClose} testId="mapsite-category-editor">
      <Notice error={error} message={message} />
      <p className="text-[11px] leading-relaxed text-neutral-500">{c.intro}</p>

      <label className="block text-xs text-neutral-600">
        {c.mainPin}
        <select
          data-testid="mapsite-main-pin-category"
          value={context.mainPinCategory ?? ""}
          disabled={pending}
          onChange={(event) => setMain(event.target.value)}
          className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">{c.none}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} title={option.description ?? undefined}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{c.mandatory}</h3>
        <ul className="space-y-1">
          {MANDATORY_PIN_CATEGORIES.map((category) => (
            <li key={category.id} className="rounded-md bg-neutral-50 px-2 py-1.5" title={category.description[locale]}>
              <span className="block text-xs font-semibold">{category.label[locale]}</span>
              <span className="block text-[11px] text-neutral-500">{category.description[locale]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{c.custom}</h3>
        {inherited ? (
          <p className="text-[11px] text-neutral-600" data-testid="mapsite-categories-inherited">
            {fmt(c.inherited, { code: inherited.toUpperCase() })}
          </p>
        ) : (
          <>
            <p className="text-[11px] text-neutral-500">{c.customHelp}</p>
            <ul className="space-y-1" data-testid="mapsite-custom-categories">
              {draft.map((label) => (
                <li key={label} className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-2 py-1">
                  <span className="truncate text-xs font-medium">{label}</span>
                  <button
                    type="button"
                    onClick={() => setDraft(draft.filter((item) => item !== label))}
                    className="text-[11px] font-semibold text-red-700"
                  >
                    {c.remove}
                  </button>
                </li>
              ))}
            </ul>
            {draft.length < MAX_CUSTOM_PIN_CATEGORIES ? (
              <div className="flex gap-1.5">
                <input
                  value={newLabel}
                  maxLength={PIN_CATEGORY_LABEL_MAX}
                  onChange={(event) => setNewLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLabel();
                    }
                  }}
                  placeholder={c.placeholder}
                  aria-label={c.custom}
                  className="block min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={addLabel}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                >
                  {c.add}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={save}
              data-testid="mapsite-save-categories"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {c.save}
            </button>
          </>
        )}
      </div>
    </PanelShell>
  );
}

/** Owner Dashboard → Partner Mapsites: a Root adds / removes Derivative Mapsites by FAST Code. */
export function MapSitePartnerPanel({
  mapsiteId,
  fastCode,
  context,
  onClose,
  onContextChange,
}: PanelProps) {
  const t = useT();
  const p = t.mapsite.partnerPanel;
  const [code, setCode] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canManage = context.role === "root";
  const upper = fastCode.trim().toUpperCase();

  function report(result: { context?: MapSiteRootContext; error?: string }, ok: string) {
    if (result.error) {
      setError(result.error);
      setMessage(null);
      return;
    }
    if (result.context) onContextChange(result.context);
    setError(null);
    setMessage(ok);
  }

  function add() {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await addMapSitePartner({ mapsiteId, fastCode, partnerFastCode: code });
      report(result, p.added);
      if (!("error" in result && result.error)) setCode("");
    });
  }

  function remove(linkId: string) {
    setConfirmId(null);
    startTransition(async () => {
      report(await removeMapSitePartner({ mapsiteId, fastCode, linkId }), p.removed);
    });
  }

  const relationLabel = { derivative: p.derivative, root: p.root, partner: p.partner } as const;

  return (
    <PanelShell title={p.title} fastCode={fastCode} onClose={onClose} testId="mapsite-partner-panel">
      <Notice error={error} message={message} />
      {context.rootFastCode ? (
        <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-900">
          {fmt(p.rootOf, { code: context.rootFastCode.toUpperCase() })}
        </p>
      ) : null}
      {derivativeNeedsRoot(context.role, context.rootFastCode) ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900" data-testid="mapsite-derivative-needs-root">
          {fmt(p.needsRoot, { code: upper })}
        </p>
      ) : null}

      {canManage ? (
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-neutral-500">{p.intro}</p>
          <label className="block text-xs text-neutral-600">
            {p.codeLabel}
            <div className="mt-1 flex gap-1.5">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
                maxLength={32}
                placeholder={p.placeholder}
                data-testid="mapsite-partner-code"
                className="block min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 font-mono text-sm uppercase"
              />
              <button
                type="button"
                disabled={pending || !code.trim()}
                onClick={add}
                data-testid="mapsite-partner-add"
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {p.add}
              </button>
            </div>
          </label>
        </div>
      ) : (
        <p className="text-[11px] text-neutral-500">{p.onlyRoot}</p>
      )}

      {context.partners.length === 0 ? (
        <p className="text-xs text-neutral-500">{p.none}</p>
      ) : (
        <ul className="space-y-1.5" data-testid="mapsite-partner-list">
          {context.partners.map((partner) => (
            <li key={partner.linkId} className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-2 py-1.5">
              <span className="min-w-0">
                <span className="block font-mono text-xs font-semibold">
                  {partner.fastCode.toUpperCase()}
                  <span className="ml-1.5 rounded bg-neutral-100 px-1 py-0.5 font-sans text-[10px] font-semibold text-neutral-600">
                    {relationLabel[partner.relation]}
                  </span>
                </span>
                {partner.title ? (
                  <span className="block truncate text-[11px] text-neutral-500">{partner.title}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 gap-1">
                <a
                  href={partner.href}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                >
                  {p.open}
                </a>
                {canManage && partner.relation === "derivative" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => (confirmId === partner.linkId ? remove(partner.linkId) : setConfirmId(partner.linkId))}
                    onBlur={() => setConfirmId((current) => (current === partner.linkId ? null : current))}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-60 ${
                      confirmId === partner.linkId
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-neutral-300 text-red-700"
                    }`}
                  >
                    {confirmId === partner.linkId ? p.confirmRemove : p.remove}
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
