"use client";

import { TALISU_CARD } from "@/lib/talisu/ui";
import { TALISU_TOKENIZATION_ESSAY } from "@/lib/talisu/tokenization-essay";

/**
 * Formatted tokenization essay for the right column of /talisu FAQ.
 * Print styles target `.talisu-tokenization-essay` (see globals.css).
 */
export default function TalisUTokenizationEssay() {
  const essay = TALISU_TOKENIZATION_ESSAY;

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <article
      id="tokenization-essay"
      className={`talisu-tokenization-essay ${TALISU_CARD} flex h-full min-h-0 flex-col scroll-mt-24 print:h-auto print:shadow-none print:ring-0`}
      aria-labelledby="talisu-essay-heading"
    >
      <header className="border-b border-neutral-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#046BD9]">
              Tokenization
            </p>
            <h2
              id="talisu-essay-heading"
              className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl"
            >
              {essay.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {essay.subtitle}
            </p>
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
        <p className="text-neutral-800">{essay.intro}</p>

        {essay.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="talisu-essay-section break-inside-avoid"
            aria-labelledby={`essay-${section.id}-title`}
          >
            <h3
              id={`essay-${section.id}-title`}
              className="mb-2 text-base font-semibold text-neutral-950 sm:text-lg break-after-avoid"
            >
              {section.title}
            </h3>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-2 first:mt-0">
                {paragraph}
              </p>
            ))}

            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}

            {section.id === "what-is-tokenized" ? (
              <div className="talisu-essay-table-wrap mt-4 overflow-x-auto print:overflow-visible">
                <table className="talisu-essay-table w-full min-w-[18rem] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    {essay.modelsTable.caption}
                  </caption>
                  <thead>
                    <tr className="border-b border-neutral-300 bg-neutral-50 print:bg-transparent">
                      {essay.modelsTable.headers.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-3 py-2.5 font-semibold text-neutral-900"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {essay.modelsTable.rows.map((row) => (
                      <tr
                        key={row.model}
                        className="border-b border-neutral-200 align-top"
                      >
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-900"
                        >
                          {row.model}
                        </th>
                        <td className="px-3 py-2.5 text-neutral-700">
                          {row.represents}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {section.lettered && section.lettered.length > 0 ? (
              <ol className="mt-3 list-none space-y-2 pl-0">
                {section.lettered.map((item) => (
                  <li key={item.letter} className="flex gap-2">
                    <span className="shrink-0 font-semibold text-neutral-900">
                      {item.letter}.
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            {section.flow ? (
              <p className="mt-3 rounded-xl bg-[#f3f7fc] px-3.5 py-2.5 font-medium text-neutral-800 ring-1 ring-[#046BD9]/15 print:bg-neutral-100">
                {section.flow}
              </p>
            ) : null}

            {section.note ? (
              <p className="mt-3 text-neutral-700">{section.note}</p>
            ) : null}


          </section>
        ))}
      </div>
    </article>
  );
}
