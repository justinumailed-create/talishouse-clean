/**
 * "Replace Image" eBook templates (PowerPoint / Keynote / Google Slides).
 * Registered (paid, active) Mapsite owners and admins only — the files live in
 * private/templates/ and are served by /api/templates/[format] after the same
 * check that unlocks the PIN Dashboard. Nothing here is secret; the Google
 * Slides copy link lives in replace-image-templates.server.ts.
 */
export const REPLACE_IMAGE_TEMPLATE_FILES = {
  pptx: {
    fileName: "Talispros-Demo-Template.pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint (.pptx)",
  },
  key: {
    fileName: "Talispros-Demo-Template.key",
    contentType: "application/x-iwork-keynote-sffkey",
    label: "Keynote (.key)",
  },
} as const;

export type ReplaceImageTemplateFormat = keyof typeof REPLACE_IMAGE_TEMPLATE_FILES;

export function isReplaceImageTemplateFormat(value: string): value is ReplaceImageTemplateFormat {
  return Object.prototype.hasOwnProperty.call(REPLACE_IMAGE_TEMPLATE_FILES, value);
}

/** Gated download URL for one template format. */
export function replaceImageTemplateHref(
  format: ReplaceImageTemplateFormat,
  fastCode?: string | null,
): string {
  const code = fastCode?.trim().toLowerCase();
  const base = `/api/templates/${format}`;
  return code ? `${base}?fastCode=${encodeURIComponent(code)}` : base;
}

/** Private location of the template files (bundled via outputFileTracingIncludes). */
export const REPLACE_IMAGE_TEMPLATE_DIR = "private/templates";
