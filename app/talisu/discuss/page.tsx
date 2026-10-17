import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ownershipTopicFromId } from "@/lib/talispros/ownership-contact";
import DiscussProjectClient from "@/components/talisu/DiscussProjectClient";

export async function generateMetadata() {
  return pageMetadata("/talisu/discuss");
}

/**
 * "Discuss a Project without first registering" (Ralf, Oct 17 2026): the
 * TalisBOT contact form as a page, with a Google-recognized Location field.
 * Every transaction-structure Learn More link opens it (?topic=…).
 */
export default async function TalisUDiscussPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string | string[] }>;
}) {
  const c = getDictionary(await getLocale()).contactForm;
  const raw = (await searchParams)?.topic;
  const topic = ownershipTopicFromId(Array.isArray(raw) ? raw[0] : raw);
  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-neutral-900 sm:py-14" data-testid="talisu-discuss">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          {c.pageTitle}
        </h1>
        <p className="mt-1 text-sm font-medium text-neutral-400">{c.pageSubtitle}</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-600">
          {c.pageIntro}
        </p>
      </header>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <DiscussProjectClient topic={topic} />
      </div>
    </div>
  );
}
