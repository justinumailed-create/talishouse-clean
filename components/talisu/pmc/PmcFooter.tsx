import Link from "next/link";
import { PMC_PATHS, pmcHref } from "@/lib/talispros/mapsite-contract";

/**
 * Footer on every PMC page: optional Back/Next, ToS + Privacy Policy links,
 * and the Canada region note.
 */
export default function PmcFooter({
  labels,
  fastCode,
  back,
  next,
}: {
  labels: {
    terms: string;
    privacy: string;
    footerNote: string;
    regionCanadaNote: string;
    back: string;
    englishOnly?: string;
  };
  fastCode?: string | null;
  back?: { href: string } | null;
  next?: { href: string; label: string } | null;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
      {back || next ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-6">
          {back ? (
            <Link
              href={back.href}
              className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:border-[#0069CF] hover:text-[#0069CF]"
            >
              ← {labels.back}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              data-testid="pmc-next"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0069CF] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0069CF]/25 transition hover:bg-[#0058ad]"
            >
              {next.label}
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          ) : null}
        </div>
      ) : null}
      <footer
        data-testid="pmc-legal-footer"
        className="mt-8 flex flex-col items-center gap-3 text-center text-[13px] text-neutral-500"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href={pmcHref(PMC_PATHS.terms, { fastCode })} className="font-semibold text-[#0069CF] hover:underline">
            {labels.terms}
          </Link>
          <span aria-hidden>·</span>
          <Link href={pmcHref(PMC_PATHS.privacy, { fastCode })} className="font-semibold text-[#0069CF] hover:underline">
            {labels.privacy}
          </Link>
        </div>
        <p>🇨🇦 {labels.regionCanadaNote}</p>
        {labels.englishOnly ? <p className="text-[12px] text-neutral-400">{labels.englishOnly}</p> : null}
        <p className="text-[12px] text-neutral-400">{labels.footerNote}</p>
      </footer>
    </div>
  );
}
