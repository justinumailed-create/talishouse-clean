import type { LegalSection } from "@/lib/talisu/pmc-legal";

/** Public pages omit draft badges. Ralf replaces the section text in the locale files. */
export function presentLegal(sections: readonly LegalSection[]): LegalSection[] {
  return sections.map((section) => {
    const next = { ...section };
    delete next.draft;
    return next;
  });
}
