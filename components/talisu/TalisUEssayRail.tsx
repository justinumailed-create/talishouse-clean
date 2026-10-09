"use client";

import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  TALISU_DEFAULT_ESSAY_SLUG,
  TALISU_ESSAYS,
  TALISU_ESSAY_QUERY_PARAM,
  resolveTalisUEssaySlug,
} from "@/components/talisu/essay-registry";

type TalisUEssayRailProps = {
  /** Slug selected on the server from `?essay=` (defaults to bare land). */
  initialSlug: string;
  /** Accessible name of the switcher (localized FAQ chrome). */
  switcherLabel: string;
};

/**
 * Right rail of /talisu FAQ: compact pill switcher (opposite the FAQ heading)
 * over the selected essay. Pills use a 5-column grid (≤ 2 rows for 10
 * entries; horizontal scroll on phones); the rail itself is sized by the page (matches the FAQ column)
 * and the essay body scrolls inside it. Only the selected essay renders, so
 * Print prints that essay. Deep link: /talisu?essay=<slug>.
 */
export default function TalisUEssayRail({ initialSlug, switcherLabel }: TalisUEssayRailProps) {
  const locale = useLocale();
  const t = useT();
  const [slug, setSlug] = useState(initialSlug);

  // Back/forward between essay deep links.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      setSlug(resolveTalisUEssaySlug(params.get(TALISU_ESSAY_QUERY_PARAM)));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function select(next: string) {
    if (next === slug) return;
    setSlug(next);
    const url = new URL(window.location.href);
    if (next === TALISU_DEFAULT_ESSAY_SLUG) url.searchParams.delete(TALISU_ESSAY_QUERY_PARAM);
    else url.searchParams.set(TALISU_ESSAY_QUERY_PARAM, next);
    window.history.replaceState(window.history.state, "", url);
  }

  const active = TALISU_ESSAYS.find((essay) => essay.slug === slug) ?? TALISU_ESSAYS[0];
  const Content = active.content;

  return (
    <>
      <div className="talisu-no-print mb-3 flex shrink-0 items-center lg:mb-6 lg:min-h-10">
        <div
          role="tablist"
          aria-label={switcherLabel}
          className="-mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0"
        >
          {TALISU_ESSAYS.map((essay) => {
            const selected = essay.slug === active.slug;
            const placeholder = essay.content === null;
            const label = essay.label[locale] ?? essay.label.en;
            return (
              <button
                key={essay.slug}
                type="button"
                role="tab"
                id={`talisu-essay-tab-${essay.slug}`}
                aria-selected={selected}
                aria-controls="talisu-essay-panel"
                title={label}
                data-placeholder={placeholder || undefined}
                onClick={() => select(essay.slug)}
                className={`shrink-0 truncate whitespace-nowrap rounded-full px-2.5 py-1 text-center text-[11px] leading-4 ring-1 transition sm:min-w-0 ${
                  placeholder ? "font-medium print:hidden" : "font-semibold"
                } ${
                  selected
                    ? placeholder
                      ? "bg-neutral-200 text-neutral-600 ring-neutral-300"
                      : "bg-[#046BD9] text-white ring-[#046BD9]"
                    : placeholder
                      ? "bg-neutral-50 text-neutral-400 ring-neutral-200 hover:text-neutral-500"
                      : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        id="talisu-essay-panel"
        role="tabpanel"
        aria-labelledby={`talisu-essay-tab-${active.slug}`}
        className="talisu-essay-panel flex min-h-0 flex-1 flex-col print:block"
      >
        {Content ? (
          <Content />
        ) : (
          <div className="talisu-no-print flex h-full min-h-[12rem] flex-1 items-center justify-center rounded-2xl bg-white p-6 text-center ring-1 ring-black/5">
            <p className="text-sm font-medium text-neutral-500">{t.talisu.essayCheckBackSoon}</p>
          </div>
        )}
      </div>
    </>
  );
}
