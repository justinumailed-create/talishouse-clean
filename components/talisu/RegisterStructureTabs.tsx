"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import { talisURegisterCheckoutHref } from "@/lib/talisu/ask-step";
import {
  normalizeRegisterStructure,
  rememberRegisterStructure,
  talisURegisterStructureHref,
  type RegisterStructureId,
} from "@/lib/talisu/register-structure";

export type RegisterStructureTab = {
  id: string;
  label: string;
  body: string;
  result: string;
};

/**
 * Aisha's four structure tabs (Conventional, Lease-to-Own, Fractionalization,
 * Tokenization). Each tab is a real link to /talisu/reg?structure=<id>; a
 * click opens the explanation card in place, updates the URL and remembers
 * the choice (cookie) so it survives the PMC registration sequence. The
 * card's Register button goes to the checkout tagged ?structure=<id>.
 */
export default function RegisterStructureTabs({
  tabs,
  initialId = null,
  label,
  selectedLabel,
  closeLabel,
  ctaLabel,
  ctaNote,
  testId = "register-structures",
}: {
  tabs: readonly RegisterStructureTab[];
  initialId?: RegisterStructureId | null;
  label: string;
  selectedLabel: string;
  closeLabel: string;
  ctaLabel: string;
  ctaNote: string;
  testId?: string;
}) {
  const baseId = useId();
  const [openId, setOpenId] = useState<RegisterStructureId | null>(initialId);
  const open = tabs.find((tab) => tab.id === openId) ?? null;
  const openIndex = open ? tabs.indexOf(open) : -1;

  function remember(id: RegisterStructureId | null) {
    rememberRegisterStructure(id);
  }

  function select(id: RegisterStructureId | null) {
    setOpenId(id);
    remember(id);
  }

  const checkoutHref = talisURegisterCheckoutHref(openId);

  return (
    <div className="mt-4 sm:mt-6" data-testid={testId} data-selected-structure={openId ?? ""}>
      <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3" role="group" aria-label={label}>
        {tabs.map((tab) => {
          const id = normalizeRegisterStructure(tab.id);
          if (!id) return null;
          const isOpen = openId === id;
          return (
            <a
              key={id}
              href={talisURegisterStructureHref(id)}
              data-testid={`${testId}-${id}`}
              data-structure-id={id}
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${baseId}-panel` : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                select(isOpen ? null : id);
              }}
              className={[
                "group relative flex min-h-14 w-full items-center justify-center overflow-hidden rounded-xl border px-2 py-2 no-underline",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.22),0_6px_14px_rgba(0,0,0,0.22)]",
                "transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                isOpen
                  ? "scale-[0.98] border-neutral-700/70 ring-1 ring-neutral-700/60"
                  : "border-white/55 hover:brightness-105 active:scale-[0.98]",
              ].join(" ")}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/20"
                aria-hidden
              />
              <span className="relative z-10 text-center text-[12px] font-semibold tracking-wide text-neutral-900 sm:text-[14px]">
                {tab.label}
              </span>
            </a>
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
              onClick={() => select(null)}
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
        <Link
          href={checkoutHref}
          data-testid="partner-cta"
          data-structure-id={openId ?? ""}
          onClick={() => remember(openId)}
          className="inline-flex min-h-12 shrink-0 flex-wrap items-center justify-center gap-x-2 rounded-full bg-[#046BD9] px-6 py-2 text-center text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0358b3] sm:text-[16px]"
        >
          <span className="whitespace-nowrap">{ctaLabel}</span>
          {open ? (
            <span className="whitespace-nowrap font-medium text-white/85" data-testid="partner-cta-structure">
              · {open.label}
            </span>
          ) : null}
          <span aria-hidden>→</span>
        </Link>
        <div className="text-[12.5px] text-neutral-600 sm:text-[13px]">
          {open ? (
            <>
              <span className="font-semibold text-neutral-800">{selectedLabel}</span> {open.label} ·{" "}
            </>
          ) : null}
          {ctaNote}
        </div>
      </div>
    </div>
  );
}
