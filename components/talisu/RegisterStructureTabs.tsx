"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SELECTED,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import { talisURegisterCheckoutHref } from "@/lib/talisu/ask-step";
import {
  normalizeRegisterStructure,
  rememberRegisterStructure,
  toggleRegisterStructure,
  type RegisterLockReason,
  type RegisterStructureId,
} from "@/lib/talisu/register-structure";

export type RegisterStructureTab = {
  id: string;
  label: string;
  body: string;
  result: string;
};

/** Extra checked state on top of the shared metal selected style. */
const TAB_CHECKED = "ring-2 ring-[#046BD9] ring-offset-1 ring-offset-[#e9e6df]";

/**
 * Aisha's four structure tabs (Conventional, Lease-to-Own, Fractionalization,
 * Tokenization), Oct 26: the tabs are toggles, like Thorsten's design tiles.
 * The page loads with none selected (only ?structure= preselects), several
 * can be selected, and "Register now" stays disabled until at least one is.
 * Enabled, it goes to ?step=register&structure=a,b; the selection is also
 * remembered (cookie) and kept in the address bar. The explanation card shows
 * the most recently selected tab.
 */
export default function RegisterStructureTabs({
  tabs,
  initialIds = [],
  bouncedReason = null,
  label,
  selectedLabel,
  selectedPluralLabel,
  lockLabel,
  closeLabel,
  ctaLabel,
  ctaNote,
  testId = "register-structures",
}: {
  tabs: readonly RegisterStructureTab[];
  initialIds?: readonly RegisterStructureId[];
  /** Set when a checkout URL without a structure was sent back here. */
  bouncedReason?: RegisterLockReason | null;
  label: string;
  selectedLabel: string;
  selectedPluralLabel: string;
  lockLabel: string;
  closeLabel: string;
  ctaLabel: string;
  ctaNote: string;
  testId?: string;
}) {
  const baseId = useId();
  const statusId = `${baseId}-status`;
  const [selected, setSelected] = useState<RegisterStructureId[]>(() => [...initialIds]);
  const [openId, setOpenId] = useState<RegisterStructureId | null>(
    initialIds.length ? initialIds[initialIds.length - 1] : null,
  );

  // Fresh visit without ?structure=: forget any older remembered choice.
  useEffect(() => {
    if (!initialIds.length) rememberRegisterStructure([]);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: RegisterStructureId) {
    const next = toggleRegisterStructure(selected, id);
    setSelected(next);
    if (next.includes(id)) setOpenId(id);
    else if (openId === id) setOpenId(next.length ? next[next.length - 1] : null);
    rememberRegisterStructure(next);
  }

  const open = tabs.find((tab) => tab.id === openId) ?? null;
  const openIndex = open ? tabs.indexOf(open) : -1;
  const locked = selected.length === 0;
  const selectedNames = tabs
    .filter((tab) => selected.includes(tab.id as RegisterStructureId))
    .map((tab) => tab.label)
    .join(", ");

  const ctaClass =
    "inline-flex min-h-12 shrink-0 flex-wrap items-center justify-center gap-x-2 rounded-full px-6 py-2 text-center text-[15px] font-semibold transition sm:text-[16px]";

  return (
    <div className="mt-4 sm:mt-6" data-testid={testId} data-selected-structure={selected.join(",")}>
      <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3" role="group" aria-label={label}>
        {tabs.map((tab) => {
          const id = normalizeRegisterStructure(tab.id);
          if (!id) return null;
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              data-testid={`${testId}-${id}`}
              data-structure-id={id}
              data-selected={isSelected ? "true" : "false"}
              aria-pressed={isSelected}
              aria-controls={openId === id ? `${baseId}-panel` : undefined}
              onClick={() => toggle(id)}
              className={`${METAL_TAB} ${isSelected ? `${METAL_TAB_SELECTED} ${TAB_CHECKED}` : METAL_TAB_UNSELECTED} cursor-pointer`}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              {isSelected ? (
                <span
                  aria-hidden
                  data-testid={`${testId}-${id}-check`}
                  className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#046BD9] text-[11px] font-bold leading-none text-white shadow ring-2 ring-white"
                >
                  ✓
                </span>
              ) : null}
              <span className={METAL_TAB_LABEL}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {open ? (
        <div
          id={`${baseId}-panel`}
          role="region"
          aria-label={open.label}
          data-testid={`${testId}-panel`}
          data-structure-id={open.id}
          className="relative mt-3 rounded-2xl border border-white/80 bg-[#fafaf7] px-4 py-4 text-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:px-5"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-full hidden h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[10px] border-x-transparent border-b-[#fafaf7] sm:block"
            style={{ left: `${((openIndex + 0.5) / tabs.length) * 100}%` }}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="text-[15px] font-semibold tracking-wide text-neutral-900 sm:text-[16px]">
              {open.label}
            </div>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label={closeLabel}
              data-testid={`${testId}-close`}
              className="-mr-1 -mt-1 rounded-full px-2 text-[20px] leading-none text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-[13.5px] leading-relaxed text-neutral-700 sm:text-[14px]">{open.body}</div>
          <div className="mt-2 text-[13.5px] font-medium leading-relaxed text-neutral-800 sm:text-[14px]">
            {open.result}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-start lg:gap-2 xl:flex-row xl:items-center xl:gap-4">
        {locked ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby={statusId}
            data-testid="partner-cta"
            data-locked="structure"
            data-structure-id=""
            className={`${ctaClass} cursor-not-allowed bg-neutral-300 text-white`}
          >
            <span className="whitespace-nowrap">
              {ctaLabel} <span aria-hidden>→</span>
            </span>
          </button>
        ) : (
          <Link
            href={talisURegisterCheckoutHref(selected)}
            data-testid="partner-cta"
            data-locked=""
            data-structure-id={selected.join(",")}
            aria-describedby={statusId}
            onClick={() => rememberRegisterStructure(selected)}
            className={`${ctaClass} bg-[#046BD9] text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3]`}
          >
            <span className="whitespace-nowrap">
              {ctaLabel} <span aria-hidden>→</span>
            </span>
          </Link>
        )}
        <div className="text-[12.5px] text-neutral-600 sm:text-[13px]">{ctaNote}</div>
      </div>
      <div
        id={statusId}
        role={bouncedReason && locked ? "alert" : "status"}
        className="mt-2 text-[13px] leading-snug"
        data-testid="register-lock-status"
      >
        {locked ? (
          <span className="font-semibold text-amber-800" data-testid="register-lock-reason-structure">
            {lockLabel}
          </span>
        ) : (
          <span className="text-neutral-800" data-testid="register-selection-summary">
            <span className="font-semibold text-neutral-900">
              {selected.length > 1 ? selectedPluralLabel : selectedLabel}
            </span>{" "}
            {selectedNames}
          </span>
        )}
      </div>
    </div>
  );
}
