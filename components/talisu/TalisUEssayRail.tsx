"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { TALISU_DISCUSS_PATH, talisuHref } from "@/lib/talisu/talisu-links";
import {
  TALISU_ESSAYS,
  TALISU_ESSAY_QUERY_PARAM,
  resolveTalisUEssaySlug,
} from "@/components/talisu/essay-registry";

type TalisUEssayRailProps = {
  /** Slug selected on the server from `?essay=` so that essay starts open. */
  initialSlug: string;
  /** Accessible name of the essay group. */
  switcherLabel: string;
};

/**
 * Right rail of /talisu: Propose a Project, then each essay as a closed
 * disclosure. A deep link opens that one essay. Print prints only that essay.
 */
export default function TalisUEssayRail({ initialSlug, switcherLabel }: TalisUEssayRailProps) {
  const locale = useLocale();
  const t = useT();
  const [openSlug, setOpenSlug] = useState<string | null>(
    initialSlug ? initialSlug : null,
  );

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const next = params.get(TALISU_ESSAY_QUERY_PARAM);
      setOpenSlug(next ? resolveTalisUEssaySlug(next) : null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function toggle(slug: string) {
    const next = openSlug === slug ? null : slug;
    setOpenSlug(next);
    const url = new URL(window.location.href);
    if (!next) url.searchParams.delete(TALISU_ESSAY_QUERY_PARAM);
    else url.searchParams.set(TALISU_ESSAY_QUERY_PARAM, next);
    window.history.replaceState(window.history.state, "", url);
  }

  function printEssay(slug: string) {
    setOpenSlug(slug);
    document.body.dataset.printEssay = slug;
    const cleanup = () => {
      delete document.body.dataset.printEssay;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => window.print(), 0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        className="talisu-propose talisu-no-print shrink-0 rounded-2xl bg-white px-4 py-4 ring-1 ring-neutral-900/10"
        data-testid="talisu-suggest-project"
      >
        <p className="m-0 text-[17px] leading-relaxed text-neutral-950">{t.talisu.valueAdded.proposeLead}</p>
        <Link
          href={talisuHref(TALISU_DISCUSS_PATH)}
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#046BD9] px-5 text-[16px] font-semibold text-white"
          data-testid="talisu-suggest-project-link"
        >
          {t.talisu.valueAdded.proposeCta}
        </Link>
      </div>
      <div role="group" aria-label={switcherLabel} className="flex min-h-0 flex-1 flex-col gap-3">
        {TALISU_ESSAYS.map((essay) => {
          const label = essay.label[locale] ?? essay.label.en;
          const Content = essay.content;
          const open = openSlug === essay.slug;
          const placeholder = Content === null;
          return (
            <section
              key={essay.slug}
              className="talisu-essay-accordion rounded-2xl bg-white ring-1 ring-neutral-900/15"
              data-print-target={open ? essay.slug : undefined}
            >
              <h2 className="m-0">
                <button
                  type="button"
                  id={`talisu-essay-tab-${essay.slug}`}
                  aria-expanded={open}
                  aria-controls={`talisu-essay-panel-${essay.slug}`}
                  onClick={() => toggle(essay.slug)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[17px] font-semibold text-neutral-950"
                >
                  <span>{label}</span>
                  <span aria-hidden className={`text-neutral-700 ${open ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
              </h2>
              {open ? (
                <div
                  id={`talisu-essay-panel-${essay.slug}`}
                  role="region"
                  aria-labelledby={`talisu-essay-tab-${essay.slug}`}
                  className="talisu-essay-panel border-t border-neutral-200 px-4 pb-4"
                >
                  {placeholder || !Content ? (
                    <p className="m-0 pt-3 text-[16px] text-neutral-800">{t.talisu.essayCheckBackSoon}</p>
                  ) : (
                    <>
                      <div className="talisu-no-print pt-3">
                        <button
                          type="button"
                          onClick={() => printEssay(essay.slug)}
                          className="talisu-essay-print-btn inline-flex min-h-10 items-center rounded-full px-4 text-[16px] font-semibold text-[#0356b0] ring-1 ring-[#0356b0]"
                          data-testid={`talisu-essay-print-${essay.slug}`}
                        >
                          {t.talisu.printEssay}
                        </button>
                      </div>
                      <div className="pt-3 text-[17px] leading-relaxed text-neutral-950">
                        <Content />
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
