import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import ValueAddedStructures from "@/components/talisu/ValueAddedStructures";

export async function generateMetadata() {
  return pageMetadata("/talisu/value-added");
}

/**
 * TalisU "Value-Added" (Arun, Oct 31): Webster's Fulfilment Options page,
 * native to Talispros (Canada, CAD). Replaces the old cross-site link to the
 * USA sister site's adviser page.
 */
export default async function TalisUValueAddedPage() {
  const t = getDictionary(await getLocale()).talisu.valueAdded;
  return (
    <AdviserLayout
      testId="talisu-value-added"
      imageSrc="/talisu/webster-banker-v3.jpg"
      imageAlt={t.imageAlt}
      imagePosition="center 20%"
      kicker={t.kicker}
      title={t.title}
    >
      <div
        className="mt-3 text-[14px] leading-relaxed text-neutral-700 sm:text-[15px]"
        data-testid="talisu-value-added-canada"
      >
        {t.canada}
      </div>
      <ValueAddedStructures />
    </AdviserLayout>
  );
}
