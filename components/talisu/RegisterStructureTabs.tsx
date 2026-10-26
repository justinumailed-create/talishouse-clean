"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_SELECTED,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import { talisURegisterCheckoutHref } from "@/lib/talisu/ask-step";
import {
  normalizeRegisterStructure,
  rememberRegisterStructure,
  selectRegisterStructure,
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
 * The shared metal label, but always on one line (no truncation): 13px with
 * normal letter-spacing so the longest German label ("Fraktionalisierung")
 * fits four-across in the adviser column. The grid below sizes each column to
 * at least its label and only goes four-across when the row really fits.
 */
const TAB_LABEL =
  "relative z-10 whitespace-nowrap text-center text-[12px] font-semibold tracking-normal text-neutral-900 sm:text-[13px]";

/**
 * Four-across only when the row fits (about 31rem of labels + padding + gaps
 * in EN/DE); otherwise 2 x 2, and one column on the narrowest screens.
 */
const TAB_GRID =
  "grid grid-cols-1 gap-2.5 @min-[19rem]:grid-cols-[repeat(2,minmax(max-content,1fr))] @min-[34rem]:grid-cols-[repeat(4,minmax(max-content,1fr))]";

/**
 * Aisha's four structure tabs (Conventional, Lease-to-Own, Fractionalization,
 * Tokenization), Oct 26: single-select, like radio buttons. Picking one
 * deselects the previous one; clicking the selected one again keeps it. The
 * page loads with none selected (only ?structure=<id> preselects) and
 * "Register now" stays disabled until one is chosen. Enabled, it goes to
 * ?step=register&structure=<id>; the choice is also remembered (cookie, one
 * value) and kept in the address bar. The explanation card shows the chosen
 * tab. Arrow keys move the choice, as in a radio group.
 */
export default function RegisterStructureTabs({
  tabs,
  initialId = null,
  bouncedReason = null,
  label,
  selectedLabel,
  lockLabel,
  closeLabel,
  ctaLabel,
  ctaNote,
  testId = "register-structures",
}: {
  tabs: readonly RegisterStructureTab[];
  initialId?: RegisterStructureId | null;
  /** Set when a checkout URL without a structure was sent back here. */
  bouncedReason?: RegisterLockReason | null;
  label: string;
  selectedLabel: string;
  lockLabel: string;
  closeLabel: string;
  ctaLabel: string;
  ctaNote: string;
  testId?: string;
}) {
  const baseId = useId();
  const statusId = `${baseId}-status`;
  const [selected, setSelected] = useState<RegisterStructureId | null>(initialId);
  const [openId, setOpenId] = useState<RegisterStructureId | null>(initialId);

  // Fresh visit without ?structure=: forget any older remembered choice.
  useEffect(() => {
    if (!initialId) rememberRegisterStructure(null);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupRef = useRef<HTMLDivElement>(null);
  const ids = tabs
    .map((tab) => normalizeRegisterStructure(tab.id))
    .filter((id): id is RegisterStructureId => id !== null);

  function choose(id: RegisterStructureId) {
    const next = selectRegisterStructure(selected, id);
    setSelected(next);
    setOpenId(next);
    rememberRegisterStructure(next);
  }

  // Radio-group keys: arrows move (and select), wrapping around.
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: RegisterStructureId) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const next = ids[(ids.indexOf(id) + step + ids.length) % ids.length];
    choose(next);
    groupRef.current?.querySelector<HTMLElement>(`[data-structure-id="${next}"]`)?.focus();
  }

  const open = tabs.find((tab) => tab.id === openId) ?? null;

  // Point the panel's arrow at the open tab (columns are content-sized).
  const [arrowLeft, setArrowLeft] = useState<number | null>(null);
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group || !openId) return;
    const place = () => {
      const tab = group.querySelector<HTMLElement>(`[data-structure-id="${openId}"]`);
      if (!tab) return;
      const g = group.getBoundingClientRect();
      const t = tab.getBoundingClientRect();
      setArrowLeft(t.left - g.left + t.width / 2);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [openId]);
  const locked = selected === null;
  const selectedName = tabs.find((tab) => tab.id === selected)?.label ?? "";

  const ctaClass =
    "inline-flex min-h-12 shrink-0 flex-wrap items-center justify-center gap-x-2 rounded-full px-6 py-2 text-center text-[15px] font-semibold transition sm:text-[16px]";

  return (
    <div className="mt-4 sm:mt-6" data-testid={testId} data-selected-structure={selected ?? ""}>
      <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        {label}
      </div>
      <div className="@container">
        <div ref={groupRef} className={TAB_GRID} role="radiogroup" aria-label={label}>
          {tabs.map((tab) => {
            const id = normalizeRegisterStructure(tab.id);
            if (!id) return null;
            const isSelected = selected === id;
            // Roving focus: the chosen tab, or the first when none is.
            const focusable = selected ? isSelected : id === ids[0];
            return (
              // The button clips its sheen (overflow-hidden), so the check
              // badge sits on this wrapper, on the tab's top-right corner.
              <div key={id} className="relative">
                <button
                  type="button"
                  data-testid={`${testId}-${id}`}
                  data-structure-id={id}
                  data-selected={isSelected ? "true" : "false"}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={focusable ? 0 : -1}
                  aria-controls={openId === id ? `${baseId}-panel` : undefined}
                  onClick={() => choose(id)}
                  onKeyDown={(event) => onKeyDown(event, id)}
                  className={`${METAL_TAB} ${isSelected ? `${METAL_TAB_SELECTED} ${TAB_CHECKED}` : METAL_TAB_UNSELECTED} cursor-pointer`}
                  style={{ backgroundImage: ADVISER_METAL_BG }}
                >
                  <span className={METAL_TAB_SHEEN} aria-hidden />
                  <span className={TAB_LABEL} data-testid={`${testId}-${id}-label`}>
                    {tab.label}
                  </span>
                </button>
                {isSelected ? (
                  <span
                    aria-hidden
                    data-testid={`${testId}-${id}-check`}
                    className="pointer-events-none absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#046BD9] text-[11px] font-bold leading-none text-white shadow ring-2 ring-white"
                  >
                    ✓
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
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
            className={`pointer-events-none absolute bottom-full hidden h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[10px] border-x-transparent border-b-[#fafaf7] ${arrowLeft === null ? "" : "sm:block"}`}
            style={arrowLeft === null ? undefined : { left: `${arrowLeft}px` }}
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
            data-structure-id={selected}
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
              {selectedLabel}
            </span>{" "}
            {selectedName}
          </span>
        )}
      </div>
    </div>
  );
}
