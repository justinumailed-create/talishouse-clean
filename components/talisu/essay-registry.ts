/**
 * Essay registry for the /talisu FAQ right rail.
 *
 * Data-driven: each entry is { slug, label, content }. To add an essay, build
 * its component (see TalisUHospitalityEssay / TalisUTokenizationEssay) and
 * append one entry here — the pill switcher, deep link (?essay=<slug>) and
 * print behaviour pick it up with no layout work. The switcher wraps to extra
 * rows, so ~10 categories fit without changing the matched rail height.
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
  content: ComponentType;
};

export const TALISU_ESSAYS: readonly TalisUEssay[] = [
  {
    slug: "tokenization",
    label: { en: "Tokenization", de: "Tokenisierung" },
    aliases: ["bare-land"],
    content: TalisUTokenizationEssay,
  },
  {
    slug: "hospitality",
    label: { en: "Hospitality", de: "Gastgewerbe" },
    aliases: ["tourism"],
    content: TalisUHospitalityEssay,
  },
];

/** First entry is the default (Tokenization). */
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
