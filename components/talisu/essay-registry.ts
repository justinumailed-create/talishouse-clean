/**
 * Essay registry for the /talisu FAQ right rail.
 *
 * Data-driven: each entry is { slug, label, content }. The pill switcher,
 * deep link (/talisu?essay=<slug>) and print behaviour all come from this
 * list — no layout work needed. Pills sit in a 5-column grid (≤ 2 rows for
 * 10 entries) and the rail height always follows the FAQ column.
 *
 * Placeholders (`content: null`) render as muted "Coming soon" pills and show
 * a short "Check back soon" note instead of an essay. To turn one into a real
 * category: change its `label` (EN + DE), optionally its `slug`, and set
 * `content` to the essay component (see TalisUHospitalityEssay +
 * lib/talisu/hospitality-essay.ts for the pattern).
 */
import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/config";
import TalisUTokenizationEssay from "@/components/talisu/TalisUTokenizationEssay";
import TalisUHospitalityEssay from "@/components/talisu/TalisUHospitalityEssay";

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

const COMING_SOON: Record<Locale, string> = { en: "Coming soon", de: "Demnächst" };

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
  // Placeholder categories — rename label/slug and set `content` when ready.
  { slug: "category-3", label: COMING_SOON, content: null },
  { slug: "category-4", label: COMING_SOON, content: null },
  { slug: "category-5", label: COMING_SOON, content: null },
  { slug: "category-6", label: COMING_SOON, content: null },
  { slug: "category-7", label: COMING_SOON, content: null },
  { slug: "category-8", label: COMING_SOON, content: null },
  { slug: "category-9", label: COMING_SOON, content: null },
  { slug: "category-10", label: COMING_SOON, content: null },
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
