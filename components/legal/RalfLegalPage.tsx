import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import PrintMeButton from "@/components/legal/PrintMeButton";
import type { RalfBlock, RalfLegalDocument } from "@/content/legal/ralf-document";

function Block({ block }: { block: RalfBlock }) {
  if (block.kind === "p") {
    return <p className="text-[17px] leading-relaxed text-neutral-950">{block.text}</p>;
  }
  if (block.kind === "h2") {
    return (
      <h2 className="pt-4 text-[1.65rem] font-bold leading-tight tracking-tight text-neutral-950 sm:text-[1.85rem]">
        {block.text}
      </h2>
    );
  }
  if (block.kind === "h3") {
    return <h3 className="pt-2 text-[1.25rem] font-bold leading-snug text-neutral-950">{block.text}</h3>;
  }
  if (block.kind === "letters") {
    return (
      <ol className="list-[lower-alpha] space-y-1.5 pl-6 text-[17px] leading-relaxed text-neutral-950">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }
  if (block.kind === "numbers") {
    return (
      <ol className="list-decimal space-y-1.5 pl-6 text-[17px] leading-relaxed text-neutral-950">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }
  if (block.kind === "lines") {
    return (
      <address className="not-italic text-[17px] leading-relaxed text-neutral-950">
        {block.items.map((item) => (
          <span key={item} className="block">
            {item}
          </span>
        ))}
      </address>
    );
  }
  return (
    <ul className="list-disc space-y-1.5 pl-6 text-[17px] leading-relaxed text-neutral-950">
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function RalfLegalPage({ document }: { document: RalfLegalDocument }) {
  return (
    <div data-testid={document.testId} className="ralf-legal flex min-h-dvh flex-col bg-white text-neutral-950">
      <TalisUMktsHeader />
      <main className="mx-auto w-full max-w-[42rem] flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <header className="ralf-legal-cover rounded-2xl bg-neutral-100 px-6 py-10 sm:px-10">
          <p className="text-[16px] font-semibold tracking-wide text-[#046BD9]">{document.coverDate}</p>
          <p className="mt-8 text-[1.35rem] font-bold tracking-wide text-[#046BD9]">{document.coverTitle}</p>
          <p className="ralf-legal-wordmark mt-2 text-[3.4rem] font-bold leading-none tracking-tight sm:text-[4.5rem]">
            TSPLITS™
          </p>
        </header>
        <article className="mt-10 space-y-4">
          {document.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </article>
        <PrintMeButton />
      </main>
    </div>
  );
}
