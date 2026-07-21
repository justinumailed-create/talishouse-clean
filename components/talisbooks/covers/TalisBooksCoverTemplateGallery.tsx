"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import TalisBooksCoverPreview from "@/components/talisbooks/covers/TalisBooksCoverPreview";
import {
  listCoverTemplates,
  selectRandomCoverTemplate,
  type TalisBooksCoverContent,
  type TalisBooksCoverTemplateDefinition,
  type TalisBooksCoverTemplateId,
} from "@/lib/talisbooks/covers";

const DEMO_CONTENT: TalisBooksCoverContent = {
  title: "Lake Country Residences",
  subtitle: "A Talispros™ Lookbook",
  heroImageUrl: "",
  heroImageAlt: "Premium residential lookbook cover",
};

interface TalisBooksCoverTemplateGalleryProps {
  initialSelectedId?: TalisBooksCoverTemplateId;
  onSelect?: (template: TalisBooksCoverTemplateDefinition) => void;
}

export default function TalisBooksCoverTemplateGallery({
  initialSelectedId,
  onSelect,
}: TalisBooksCoverTemplateGalleryProps) {
  const templates = listCoverTemplates();
  const [selectedId, setSelectedId] = useState<TalisBooksCoverTemplateId>(
    initialSelectedId ?? templates[0].id,
  );

  const selectManual = (template: TalisBooksCoverTemplateDefinition) => {
    setSelectedId(template.id);
    onSelect?.(template);
  };

  const selectRandom = () => {
    const template = selectRandomCoverTemplate();
    setSelectedId(template.id);
    onSelect?.(template);
  };

  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Premium Covers
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Five distinct layouts with a large hero image, title, subtitle, and white top
            and bottom margins. Choose manually or pick one at random.
          </p>
        </div>
        <button
          type="button"
          onClick={selectRandom}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <Shuffle className="h-4 w-4" />
          Random cover
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              {selected.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{selected.description}</p>
          </div>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Selected
          </span>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <TalisBooksCoverPreview template={selected} content={DEMO_CONTENT} selected />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isSelected = template.id === selectedId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => selectManual(template)}
              className={[
                "rounded-2xl border bg-white p-3 text-left shadow-sm transition-all",
                isSelected
                  ? "border-neutral-900 ring-2 ring-neutral-900/10"
                  : "border-neutral-200 hover:border-neutral-400",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <TalisBooksCoverPreview
                template={template}
                content={DEMO_CONTENT}
                selected={isSelected}
              />
              <div className="mt-3 px-1">
                <p className="text-sm font-semibold text-neutral-900">{template.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
