import { legalSectionId, type LegalBlock, type LegalSection } from "@/lib/talisu/pmc-legal";

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  if ("list" in block) {
    return (
      <ul className="list-disc space-y-1.5 pl-5">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="list-[lower-alpha] space-y-1.5 pl-5">
      {block.lettered.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

/** Numbered legal sections (Service Agreement / ToS / Privacy Policy). */
export default function LegalDocument({
  sections,
  intro,
  compact = false,
}: {
  sections: LegalSection[];
  intro?: string;
  compact?: boolean;
}) {
  return (
    <div className={`space-y-7 text-[15px] leading-relaxed text-neutral-700 ${compact ? "text-[14px]" : ""}`}>
      {intro ? <p className="text-neutral-800">{intro}</p> : null}
      {sections.map((s) => (
        <section
          key={legalSectionId(s)}
          id={legalSectionId(s)}
          data-testid={s.id ? `legal-${s.id}` : undefined}
          className={`scroll-mt-24 ${s.draft ? "rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-5" : ""}`}
        >
          <h2 className="mb-2.5 flex flex-wrap items-baseline gap-2 text-lg font-bold text-neutral-900">
            {s.n != null ? <span className="text-[#0069CF]">{s.n}.</span> : null}
            {s.title}
            {s.draft ? (
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
                {s.draft}
              </span>
            ) : null}
          </h2>
          <div className="space-y-3">
            {s.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
