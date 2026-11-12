import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/server";
import {
  REPLACE_IMAGE_TEMPLATE_FILES,
  replaceImageTemplateHref,
} from "@/lib/talispros/replace-image-templates";
import { replaceImageTemplateAvailability } from "@/lib/talispros/replace-image-templates.server";

/**
 * Server component: Replace Image templates for registered Mapsite owners.
 * The Google Slides copy link is passed in from the server.
 */
export default async function OwnerReplaceImageTemplates({
  fastCode,
  googleSlidesCopyHref,
}: {
  fastCode: string;
  googleSlidesCopyHref: string;
}) {
  const locale = (await getLocale()) === "de" ? "de" : "en";
  const d = getDictionary(locale).demo;
  const ready = replaceImageTemplateAvailability();
  const slidesReady = ready.slides && Boolean(googleSlidesCopyHref);
  const link =
    "inline-flex min-h-9 items-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-900 hover:bg-neutral-50";
  const disabled =
    "inline-flex min-h-9 cursor-not-allowed items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-xs font-semibold text-neutral-400";
  return (
    <section
      aria-labelledby="replace-image-templates-heading"
      data-testid="owner-replace-image-templates"
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <h2 id="replace-image-templates-heading" className="text-sm font-semibold text-neutral-900">
        {d.downloadMenuTemplates}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        {locale === "de"
          ? "Fertige eBook-Layouts: Bilder ersetzen, Folien hinzufügen oder löschen (höchstens 20 Seiten empfohlen), als PDF exportieren und hier hochladen. Folie 1 ist der Umschlag; jede weitere Folie wird eine Doppelseite."
          : "Ready-made eBook layouts: replace the images, add or delete slides (20 pages recommended max), export as PDF and upload it here. Slide 1 is the wrap cover; every other slide becomes a two-page spread."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ready.pptx ? (
          <a href={replaceImageTemplateHref("pptx", fastCode)} className={link}>
            {d.downloadMenuPptx}
          </a>
        ) : (
          <span className={disabled}>
            {REPLACE_IMAGE_TEMPLATE_FILES.pptx.label} — {d.downloadMenuComingSoon}
          </span>
        )}
        {ready.key ? (
          <a href={replaceImageTemplateHref("key", fastCode)} className={link}>
            {d.downloadMenuKeynote}
          </a>
        ) : (
          <span className={disabled}>
            {REPLACE_IMAGE_TEMPLATE_FILES.key.label} — {d.downloadMenuComingSoon}
          </span>
        )}
        {slidesReady ? (
          <a href={googleSlidesCopyHref} target="_blank" rel="noopener noreferrer" className={link}>
            {d.downloadMenuSlides} — {d.downloadMenuMakeCopy}
          </a>
        ) : (
          <span className={disabled}>
            {d.downloadMenuSlides} — {d.downloadMenuComingSoon}
          </span>
        )}
      </div>
    </section>
  );
}
