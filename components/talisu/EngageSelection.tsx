"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import EngageDesignGallery from "@/components/talisu/EngageDesignGallery";
// Type-only: engage-designs.ts reads the page list from disk (server only).
import type { EngageDesign } from "@/lib/talisu/engage-designs";
import {
  ENGAGE_REGISTER_PATH,
  engageLockReason,
  engagePayHref,
  type EngageLockReason,
} from "@/lib/talisu/engage-lock";
import {
  normalizeEngageStructure,
  type EngageStructureId,
} from "@/lib/talisu/engage-structure";
import { REGISTER_STRUCTURE_COOKIE } from "@/lib/talisu/register-structure";

/** Summary shows up to this many codes, then "+N". */
const SUMMARY_MAX_CODES = 6;

function readStructureCookie(): EngageStructureId | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REGISTER_STRUCTURE_COOKIE}=`));
  return normalizeEngageStructure(entry?.slice(REGISTER_STRUCTURE_COOKIE.length + 1));
}

/**
 * /talisu/engage selection + lock (Ralf, Oct 26). The gallery tiles toggle
 * designs (multi-select); the single "Engage Thorsten P" button stays disabled
 * until a structure was chosen on Aisha's page (?structure= / cookie) AND at
 * least one design is selected. Enabled, it goes to
 * ?step=pay&structure=<id>&product=P03,P07 (the pay step re-checks both).
 */
export default function EngageSelection({
  designs,
  initialStructure,
  initialCodes,
  structureTitles,
  bouncedReason,
}: {
  designs: EngageDesign[];
  initialStructure: EngageStructureId | null;
  initialCodes: readonly string[];
  structureTitles: Readonly<Record<string, string>>;
  /** Set when a direct ?step=pay URL was sent back here (?locked=). */
  bouncedReason: EngageLockReason | null;
}) {
  const t = useT().talisu;
  const e = t.engage;
  const statusId = useId();
  const [structure, setStructure] = useState<EngageStructureId | null>(initialStructure);
  const [selected, setSelected] = useState<string[]>(() => [...initialCodes]);

  // Coming back from /talisu/reg (incl. browser Back / bfcache): re-read the
  // structure Aisha's tabs remembered.
  useEffect(() => {
    if (initialStructure) return;
    const sync = () => {
      const fromCookie = readStructureCookie();
      if (fromCookie) setStructure(fromCookie);
    };
    sync();
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, [initialStructure]);

  function toggle(code: string) {
    setSelected((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    );
  }

  const reason = engageLockReason(structure, selected);
  const locked = reason !== null;
  const shownCodes = selected.slice(0, SUMMARY_MAX_CODES).join(", ");
  const codesLabel =
    selected.length > SUMMARY_MAX_CODES
      ? `${shownCodes} +${selected.length - SUMMARY_MAX_CODES}`
      : shownCodes;
  const structureTitle = structure ? (structureTitles[structure] ?? structure) : null;

  const ctaClass =
    "inline-flex min-h-12 shrink-0 flex-wrap items-center justify-center gap-x-2 rounded-full px-6 py-2 text-center text-[15px] font-semibold transition sm:text-[16px]";

  return (
    <>
      <section
        className="mt-4 min-w-0"
        data-testid="engage-catalogue"
        aria-label={e.catalogueLabel}
      >
        <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
          {e.catalogueLabel}
        </div>
        <EngageDesignGallery designs={designs} selected={selected} onToggle={toggle} />
        <div className="mt-1.5 text-center text-[12.5px] text-neutral-600" data-testid="engage-catalogue-hint">
          {e.catalogueHint}
        </div>
      </section>
      <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-start lg:gap-2 xl:flex-row xl:items-center xl:gap-4">
        {locked ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby={statusId}
            data-testid="partner-cta"
            data-locked={reason}
            className={`${ctaClass} cursor-not-allowed bg-neutral-300 text-white`}
          >
            <span className="whitespace-nowrap">{t.engageWebster}</span>
            <span aria-hidden>→</span>
          </button>
        ) : (
          <Link
            href={engagePayHref(selected, structure)}
            data-testid="partner-cta"
            data-locked=""
            aria-describedby={statusId}
            className={`${ctaClass} bg-[#046BD9] text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3]`}
          >
            <span className="whitespace-nowrap">{t.engageWebster}</span>
            <span aria-hidden>→</span>
          </Link>
        )}
        <div className="text-[12.5px] text-neutral-600 sm:text-[13px]">{e.adviserCtaNote}</div>
      </div>
      <div
        id={statusId}
        role={bouncedReason && locked ? "alert" : "status"}
        className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-snug"
        data-testid="engage-lock-status"
        data-structure={structure ?? ""}
        data-selected-codes={selected.join(",")}
      >
        {structureTitle ? (
          <span className="text-neutral-700" data-testid="engage-selected-structure">
            {fmt(e.structureSummary, { structure: structureTitle })}
          </span>
        ) : (
          <Link
            href={ENGAGE_REGISTER_PATH}
            className="font-semibold text-amber-800 underline decoration-amber-800/40 underline-offset-2 hover:decoration-amber-800"
            data-testid="engage-lock-reason-structure"
          >
            {e.lockNeedStructure} →
          </Link>
        )}
        {selected.length ? (
          <span className="font-semibold text-neutral-900" data-testid="engage-selection-summary">
            {fmt(e.selectedSummary, { codes: codesLabel })}
          </span>
        ) : (
          <span
            className={structureTitle ? "font-semibold text-amber-800" : "text-amber-800"}
            data-testid="engage-lock-reason-design"
          >
            {e.lockNeedDesign}
          </span>
        )}
      </div>
    </>
  );
}
