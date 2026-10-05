import { TALISU_FAQ } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | FAQ",
  description: "Frequently asked questions about Talispros™, Mapsites™, and TalisU™.",
  path: "/talisu",
});

export default function TalisUHomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-neutral-900 sm:px-5 sm:py-14">
      <section id="faq" className="scroll-mt-24" aria-labelledby="talisu-faq-heading">
        <h1
          id="talisu-faq-heading"
          className="mb-6 text-center text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl"
        >
          {TALISU_FAQ.title}
        </h1>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {TALISU_FAQ.items.map((item) => {
            const paragraphs = Array.isArray(item.answer)
              ? item.answer
              : [item.answer];
            return (
              <details
                key={item.question}
                className={`group ${TALISU_CARD} open:ring-[#046BD9]/25`}
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-[#0069CF] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    <span>{item.question}</span>
                    <span
                      aria-hidden
                      className="mt-0.5 shrink-0 text-neutral-400 transition group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {item.bullets && item.bullets.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {item.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
