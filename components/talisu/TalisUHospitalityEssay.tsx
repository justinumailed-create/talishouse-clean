"use client";

import { Fragment } from "react";
import { TALISU_CARD } from "@/lib/talisu/ui";
import {
  TALISU_HOSPITALITY_ESSAY,
  type HospitalityEssayBlock,
} from "@/lib/talisu/hospitality-essay";

const CALLOUT_CLASS =
  "mt-3 rounded-xl bg-[#f3f7fc] px-3.5 py-2.5 font-medium text-neutral-800 ring-1 ring-[#046BD9]/15 print:bg-neutral-100";

function EssayBlock({ block }: { block: HospitalityEssayBlock }) {
  switch (block.type) {
    case "p":
      return <p className="mt-2 first:mt-0">{block.text}</p>;
    case "h4":
      return (
        <h4 className="mt-4 text-[15px] font-semibold text-neutral-900 break-after-avoid">
          {block.text}
        </h4>
      );
    case "bullets":
      return (
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className={CALLOUT_CLASS}>
          {block.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      );
    case "example":
      return (
        <div className="talisu-essay-example mt-3 rounded-xl border border-[#046BD9]/20 bg-white px-3.5 py-3 print:border-neutral-300">
          <ul className="divide-y divide-neutral-100">
            {block.items.map((item) => (
              <li key={item} className="py-1.5 font-medium text-neutral-800">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "flow":
      return (
        <ol
          className={`talisu-essay-flow mt-3 flex list-none flex-col items-stretch pl-0 ${
            block.numbered ? "" : "sm:mx-auto sm:max-w-sm"
          }`}
        >
          {block.steps.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 ? (
                <li
                  aria-hidden
                  role="presentation"
                  className="py-0.5 text-center text-base leading-none text-[#046BD9]"
                >
                  ↓
                </li>
              ) : null}
              <li
                className={`talisu-essay-flow-step flex items-start gap-2.5 rounded-xl bg-[#f3f7fc] px-3.5 py-2 ring-1 ring-[#046BD9]/15 print:bg-neutral-100 ${
                  block.numbered ? "" : "justify-center text-center"
                }`}
              >
                {block.numbered ? (
                  <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#046BD9] text-[11px] font-semibold text-white print:bg-neutral-700">
                    {index + 1}
                  </span>
                ) : null}
                <span>
                  <span className="block font-medium text-neutral-900">
                    {step.label}
                  </span>
                  {step.caption ? (
                    <span className="block text-[13px] text-neutral-600">
                      {step.caption}
                    </span>
                  ) : null}
                </span>
              </li>
            </Fragment>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

/**
 * Hospitality (retiring going-concern owner) tokenization essay for the
 * right column of /talisu FAQ. Same card + print classes as the bare-land
 * essay so the existing print CSS (globals.css) applies.
 */
export default function TalisUHospitalityEssay() {
  const essay = TALISU_HOSPITALITY_ESSAY;

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <article
      id="hospitality-essay"
      className={`talisu-tokenization-essay ${TALISU_CARD} flex h-full min-h-0 flex-col scroll-mt-24 print:h-auto print:shadow-none print:ring-0`}
      aria-labelledby="talisu-hospitality-essay-heading"
    >
      <header className="border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#046BD9]">
              {essay.eyebrow}
            </p>
            <h2
              id="talisu-hospitality-essay-heading"
              className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl"
            >
              {essay.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="talisu-no-print shrink-0 inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            Print essay
          </button>
        </div>
        <p className="mt-3 text-xs italic text-neutral-500">{essay.disclaimer}</p>
      </header>

      <div className="talisu-essay-body mt-5 min-h-0 flex-1 space-y-7 overflow-y-auto text-sm leading-relaxed text-neutral-700 sm:text-[15px] print:overflow-visible">
        <div className="space-y-3 text-neutral-800">
          {essay.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {essay.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="talisu-essay-section"
            aria-labelledby={`essay-${section.id}-title`}
          >
            <h3
              id={`essay-${section.id}-title`}
              className="mb-2 text-base font-semibold text-neutral-950 sm:text-lg break-after-avoid"
            >
              {section.title}
            </h3>
            {section.blocks.map((block, index) => (
              <EssayBlock key={`${section.id}-${index}`} block={block} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
