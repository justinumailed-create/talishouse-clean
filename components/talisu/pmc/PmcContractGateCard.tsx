"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { PMC_PATHS, pmcHref } from "@/lib/talispros/mapsite-contract";

/** Shown instead of activation checkout until the Service Agreement is signed. */
export default function PmcContractGateCard({
  fastCode,
  compact = false,
}: {
  fastCode?: string | null;
  compact?: boolean;
}) {
  const t = useT().pmc;
  return (
    <div
      data-testid="pmc-contract-gate"
      className={`pmc-page ${compact ? "w-full" : MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-2xl border border-white/20 bg-white p-5 text-neutral-900 shadow-2xl`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0069CF]">
        {t.steps.join(" → ")}
      </p>
      <h2 className="mt-2 text-lg font-black text-[#06182f]">{t.gate.title}</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{t.gate.body}</p>
      <Link
        href={pmcHref(PMC_PATHS.talispros, { fastCode })}
        className="mt-4 inline-flex w-full justify-center rounded-full bg-[#0069CF] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0058ad]"
      >
        {t.gate.cta} →
      </Link>
    </div>
  );
}
