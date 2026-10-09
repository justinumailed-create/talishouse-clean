"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import {
  TALISU_DEFAULT_ESSAY_SLUG,
  TALISU_ESSAYS,
  TALISU_ESSAY_QUERY_PARAM,
  resolveTalisUEssaySlug,
} from "@/components/talisu/essay-registry";

type TalisUEssayRailProps = {
  /** Slug selected on the server from `?essay=` (defaults to tokenization). */
  initialSlug: string;
  /** Accessible name of the switcher (localized FAQ chrome). */
  switcherLabel: string;
};

/**
 * Right rail of /talisu FAQ: compact pill switcher (opposite the FAQ heading)
 * over the selected essay. Pills wrap to extra rows, so the registry can grow
 * to ~10 essays; the rail itself is sized by the page (matches the FAQ column)
 * and the essay body scrolls inside it. Only the selected essay renders, so
 * Print prints that essay. Deep link: /talisu?essay=<slug>.
 */
export default function TalisUEssayRail({ initialSlug, switcherLabel }: TalisUEssayRailProps) {
  const locale = useLocale();
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
      <div className="talisu-no-print mb-3 flex shrink-0 items-center justify-center lg:mb-6 lg:min-h-10 lg:justify-end">
        <div
          role="tablist"
          aria-label={switcherLabel}
          className="flex max-w-full flex-wrap justify-center gap-1.5 lg:justify-end"
        >
          {TALISU_ESSAYS.map((essay) => {
            const selected = essay.slug === active.slug;
            return (
              <button
                key={essay.slug}
                type="button"
                role="tab"
                id={`talisu-essay-tab-${essay.slug}`}
                aria-selected={selected}
                aria-controls="talisu-essay-panel"
                onClick={() => select(essay.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  selected
                    ? "bg-[#046BD9] text-white ring-[#046BD9]"
                    : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                {essay.label[locale] ?? essay.label.en}
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
        <Content />
      </div>
    </>
  );
}
