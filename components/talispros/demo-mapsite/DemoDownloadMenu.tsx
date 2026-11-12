"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import { REPLACE_IMAGE_TEMPLATE_FILES } from "@/lib/talispros/replace-image-templates";

export type TemplateAvailability = {
  pptx: boolean;
  key: boolean;
  slides: boolean;
};

/**
 * Replace Image templates on the public demo. The three buttons are visible
 * to everyone. A download runs only for a registered owner; anyone else gets
 * a short prompt to register. A missing file stays visible as Coming soon.
 */
export default function DemoDownloadMenu({
  className = "",
  variant = "primary",
  availability = { pptx: true, key: true, slides: true },
}: {
  className?: string;
  align?: "left" | "right";
  variant?: "primary" | "secondary";
  availability?: TemplateAvailability;
}) {
  const d = useT().demo;
  const [prompt, setPrompt] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const buttonClass =
    variant === "secondary"
      ? "inline-flex min-h-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 text-left text-[13px] font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[14px]"
      : "inline-flex min-h-10 items-center justify-center rounded-full bg-neutral-950 px-4 text-left text-[13px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[14px]";

  async function openTemplate(format: "pptx" | "key" | "slides") {
    setPrompt(false);
    setBusy(format);
    try {
      const response = await fetch(`/api/templates/${format}`, { credentials: "same-origin" });
      if (response.status === 403) {
        setPrompt(true);
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

  const items = [
    { format: "pptx" as const, ready: availability.pptx, label: d.downloadMenuPptx },
    { format: "key" as const, ready: availability.key, label: d.downloadMenuKeynote },
    {
      format: "slides" as const,
      ready: availability.slides,
      label: availability.slides ? `${d.downloadMenuSlides} — ${d.downloadMenuMakeCopy}` : d.downloadMenuSlides,
    },
  ];

  return (
    <div className={className || "relative"} data-testid="demo-download-menu">
      <div className="flex flex-wrap gap-2" data-testid="template-download-buttons">
        {items.map((item) => (
          <button
            key={item.format}
            type="button"
            disabled={!item.ready || busy === item.format}
            onClick={() => void openTemplate(item.format)}
            data-testid={`template-${item.format}`}
            className={buttonClass}
          >
            {item.ready ? item.label : `${item.label} — ${d.downloadMenuComingSoon}`}
          </button>
        ))}
      </div>
      {prompt ? (
        <p className="mt-2 max-w-sm text-[13px] leading-snug text-neutral-600" data-testid="template-register-prompt">
          {d.downloadMenuPrompt}{" "}
          <Link href={ROUTES.TALISU_REGISTER} className="font-semibold text-[#1E4ED8] underline">
            {d.downloadMenuRegister}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
