"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import { REPLACE_IMAGE_TEMPLATE_FILES } from "@/lib/talispros/replace-image-templates";

const FORMATS = ["pptx", "key", "slides"] as const;

/**
 * PowerPoint, Keynote and Google Slides on the eBook header.
 * Locked visitors see disabled controls. The files are fetched only after
 * the server has confirmed a registered owner.
 */
export default function EbookPlatformLinks({ unlocked }: { unlocked: boolean }) {
  const d = useT().demo;
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const labels = {
    pptx: d.downloadMenuPptx,
    key: d.downloadMenuKeynote,
    slides: d.downloadMenuSlides,
  };

  async function openTemplate(format: (typeof FORMATS)[number]) {
    if (!unlocked) return;
    setNote(null);
    setBusy(format);
    try {
      const response = await fetch(`/api/templates/${format}`, { credentials: "same-origin" });
      if (response.status === 403) {
        setNote(d.downloadMenuRegister);
        return;
      }
      if (!response.ok) return;
      if (format === "slides") {
        const data = (await response.json()) as { url?: string };
        if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = REPLACE_IMAGE_TEMPLATE_FILES[format].fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1" data-testid="ebook-platform-links">
      <div className="flex flex-wrap justify-end gap-1.5">
        {FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            disabled={!unlocked || busy === format}
            onClick={() => void openTemplate(format)}
            data-testid={`ebook-platform-${format}`}
            className="talisbooks-viewer__back min-h-11 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {labels[format]}
          </button>
        ))}
      </div>
      {unlocked ? null : (
        <p className="m-0 text-[15px] font-semibold text-neutral-950" data-testid="ebook-platform-locked">
          <Link href={ROUTES.TALISU_REGISTER} className="underline">
            {d.downloadMenuRegister}
          </Link>
        </p>
      )}
      {note ? (
        <p className="m-0 text-[15px] font-semibold text-neutral-950" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}
