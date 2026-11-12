import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import LegalDocument from "@/components/talisu/pmc/LegalDocument";
import LegalLinks from "@/components/legal/LegalLinks";
import type { LegalSection } from "@/lib/talisu/pmc-legal";

export default function PublicLegalPage({
  testId,
  kicker,
  title,
  meta,
  sections,
}: {
  testId: string;
  kicker: string;
  title: string;
  meta: string[];
  sections: LegalSection[];
}) {
  return (
    <div data-testid={testId} className="flex min-h-dvh flex-col bg-white text-neutral-900">
      <TalisUMktsHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#046BD9]">{kicker}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-[13px] text-neutral-500">{meta.join(" · ")}</p>
        <div className="mt-8">
          <LegalDocument sections={sections} />
        </div>
      </main>
      <footer className="border-t border-neutral-200 px-4 py-6">
        <div className="mx-auto flex max-w-3xl justify-center">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
