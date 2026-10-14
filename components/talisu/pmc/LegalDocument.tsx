import type { LegalBlock, LegalSection } from "@/lib/talisu/pmc-legal";

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
        <section key={s.n} id={`section-${s.n}`} className="scroll-mt-24">
          <h2 className="mb-2.5 flex items-baseline gap-2 text-lg font-bold text-neutral-900">
            <span className="text-[#0069CF]">{s.n}.</span>
            {s.title}
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
