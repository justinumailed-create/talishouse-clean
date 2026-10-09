import {
  REPLACE_IMAGE_TEMPLATE_FILES,
  replaceImageTemplateHref,
} from "@/lib/talispros/replace-image-templates";

/**
 * Server component: "Replace Image" templates for registered Mapsite owners.
 * Rendered only on owner pages that already passed canEditMapSite; the Google
 * Slides copy link is passed in from the server (never in a client bundle).
 */
export default function OwnerReplaceImageTemplates({
  fastCode,
  googleSlidesCopyHref,
}: {
  fastCode: string;
  googleSlidesCopyHref: string;
}) {
  const link =
    "inline-flex min-h-9 items-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-900 hover:bg-neutral-50";
  return (
    <section
      aria-labelledby="replace-image-templates-heading"
      data-testid="owner-replace-image-templates"
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <h2 id="replace-image-templates-heading" className="text-sm font-semibold text-neutral-900">
        Replace Image templates
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        Ready-made eBook layouts: replace the images, add or delete slides (20 pages
        recommended max), export as PDF and upload it here. Slide 1 is the wrap cover;
        every other slide becomes a two-page spread.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={replaceImageTemplateHref("pptx", fastCode)} className={link}>
          {REPLACE_IMAGE_TEMPLATE_FILES.pptx.label}
        </a>
        <a href={replaceImageTemplateHref("key", fastCode)} className={link}>
          {REPLACE_IMAGE_TEMPLATE_FILES.key.label}
        </a>
        <a href={googleSlidesCopyHref} target="_blank" rel="noopener noreferrer" className={link}>
          Google Slides (make a copy) ↗
        </a>
      </div>
    </section>
  );
}
