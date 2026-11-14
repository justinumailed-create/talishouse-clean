/**
 * Essay registry for the /talisu FAQ right rail.
 *
 * Data-driven: each entry is { slug, label, content }. The list is open —
 * add an essay and the /talisu rail grows. Deep link: /talisu?essay=<slug>.
 */
import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/config";
import TalisUTokenizationEssay from "@/components/talisu/TalisUTokenizationEssay";
import TalisUHospitalityEssay from "@/components/talisu/TalisUHospitalityEssay";
import TalisUStudentHousingEssay from "@/components/talisu/TalisUStudentHousingEssay";
import TalisULongTermCareEssay from "@/components/talisu/TalisULongTermCareEssay";

export type TalisUEssay = {
  /** URL slug: /talisu?essay=<slug>. */
  slug: string;
  /** Pill label per locale (essay bodies themselves are English). */
  label: Record<Locale, string>;
  /** Extra slugs that resolve to this essay (old / alternate names). */
  aliases?: readonly string[];
  /** Essay component, or null for a "Coming soon" placeholder category. */
  content: ComponentType | null;
};

export const TALISU_ESSAYS: readonly TalisUEssay[] = [
  {
    slug: "bare-land",
    label: { en: "Bare Land", de: "Bauland" },
    aliases: ["tokenization"],
    content: TalisUTokenizationEssay,
  },
  {
    slug: "hospitality",
    label: { en: "Hospitality", de: "Gastgewerbe" },
    aliases: ["tourism"],
    content: TalisUHospitalityEssay,
  },
  {
    slug: "student-housing",
    label: { en: "Student Housing", de: "Studentenwohnen" },
    content: TalisUStudentHousingEssay,
  },
  {
    slug: "long-term-care",
    label: { en: "Long-Term Care", de: "Langzeitpflege" },
    content: TalisULongTermCareEssay,
  },
];

/** First entry is the default (Bare Land). */
export const TALISU_DEFAULT_ESSAY_SLUG = TALISU_ESSAYS[0].slug;

export const TALISU_ESSAY_QUERY_PARAM = "essay";

/** Resolves `?essay=` to a known slug; unknown / missing → default essay. */
export function resolveTalisUEssaySlug(
  value: string | string[] | null | undefined,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const v = (raw || "").trim().toLowerCase();
  const match = TALISU_ESSAYS.find(
    (essay) => essay.slug === v || essay.aliases?.includes(v),
  );
  return match ? match.slug : TALISU_DEFAULT_ESSAY_SLUG;
}
