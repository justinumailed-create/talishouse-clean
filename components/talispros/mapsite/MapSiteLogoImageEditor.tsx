"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { postEbookGenerateOptimizedImage } from "@/lib/media/client-upload-ebook-image";
import { saveMapSiteBrandingAction } from "@/app/talispros/mapsite/dashboard-actions";
import type {
  MapSiteBrandingField,
  MapSiteOwnerCustomizations,
} from "@/lib/talispros/mapsite-owner-customizations";
import MapSiteDashboardPanel, { DashboardNotice } from "./MapSiteDashboardPanel";

type MapSiteLogoImageEditorProps = {
  mapsiteId: string;
  fastCode: string;
  /** Effective images now shown on the left card. */
  currentLogoUrl: string;
  currentPartnerImageUrl: string;
  /** Build defaults restored by Reset. */
  defaultLogoUrl: string;
  defaultPartnerImageUrl: string;
  customizations: MapSiteOwnerCustomizations;
  onClose: () => void;
  onSaved: (next: MapSiteOwnerCustomizations) => void;
};

type SlotState = {
  /** Uploaded (not yet saved) URL. */
  pendingUrl: string | null;
  /** Local object URL for instant preview while uploading. */
  localPreview: string | null;
  uploading: boolean;
};

const EMPTY_SLOT: SlotState = { pendingUrl: null, localPreview: null, uploading: false };

const SLOTS: Array<{
  field: MapSiteBrandingField;
  label: string;
  help: string;
  kind: "logo" | "agent";
}> = [
  {
    field: "logo",
    label: "Logo",
    help: "Shown at the top of the left write-up card. PNG with a transparent background works best.",
    kind: "logo",
  },
  {
    field: "partnerImage",
    label: "Left-card image",
    help: "Replaces the partner photo in the left write-up card. Portrait (3:4) works best.",
    kind: "agent",
  },
];

/** Logo & Image Editor: upload / replace / reset the left-card logo and photo. */
export default function MapSiteLogoImageEditor({
  mapsiteId,
  fastCode,
  currentLogoUrl,
  currentPartnerImageUrl,
  defaultLogoUrl,
  defaultPartnerImageUrl,
  customizations,
  onClose,
  onSaved,
}: MapSiteLogoImageEditorProps) {
  const [slots, setSlots] = useState<Record<MapSiteBrandingField, SlotState>>({
    logo: EMPTY_SLOT,
    partnerImage: EMPTY_SLOT,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function patchSlot(field: MapSiteBrandingField, patch: Partial<SlotState>) {
    setSlots((current) => ({ ...current, [field]: { ...current[field], ...patch } }));
  }

  async function handleFile(
    field: MapSiteBrandingField,
    kind: "logo" | "agent",
    file: File | null | undefined,
  ) {
    if (!file) return;
    setError(null);
    setMessage(null);
    const preview = URL.createObjectURL(file);
    objectUrls.current.push(preview);
    patchSlot(field, { localPreview: preview, pendingUrl: null, uploading: true });
    try {
      const uploaded = await postEbookGenerateOptimizedImage({
        mapsiteId,
        kind,
        file,
        label: file.name || (field === "logo" ? "Logo" : "Left-card image"),
      });
      patchSlot(field, { pendingUrl: uploaded.url, uploading: false });
    } catch (uploadError) {
      patchSlot(field, { localPreview: null, pendingUrl: null, uploading: false });
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed. Try again.",
      );
    }
  }

  function save(field: MapSiteBrandingField, url: string | null, done: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMapSiteBrandingAction({ mapsiteId, fastCode, field, url });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved(result.customizations);
      patchSlot(field, EMPTY_SLOT);
      setMessage(done);
    });
  }

  return (
    <MapSiteDashboardPanel title="Logo & Image Editor" fastCode={fastCode} onClose={onClose}>
      {message ? <DashboardNotice tone="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice tone="error">{error}</DashboardNotice> : null}

      {SLOTS.map((slot) => {
        const state = slots[slot.field];
        const saved =
          slot.field === "logo" ? customizations.logoUrl : customizations.partnerImageUrl;
        const current = slot.field === "logo" ? currentLogoUrl : currentPartnerImageUrl;
        const fallback = slot.field === "logo" ? defaultLogoUrl : defaultPartnerImageUrl;
        const preview = state.localPreview || current;
        const inputId = `mapsite-branding-${slot.field}`;
        return (
          <div key={slot.field} className="space-y-2 rounded-md border border-neutral-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {slot.label}
              </h3>
              <span className="text-[10px] text-neutral-400">
                {state.pendingUrl ? "Preview — not saved" : saved ? "Custom" : "Default"}
              </span>
            </div>
            <div
              className={`flex items-center justify-center overflow-hidden rounded-md bg-[#f2f2f0] ${
                slot.field === "logo" ? "h-24" : "h-40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`${slot.label} preview`}
                className={
                  slot.field === "logo"
                    ? "max-h-20 max-w-[12rem] object-contain"
                    : "h-full w-auto object-cover object-top"
                }
              />
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">{slot.help}</p>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
              >
                {state.uploading ? "Uploading…" : saved || state.pendingUrl ? "Replace" : "Upload"}
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={state.uploading || pending}
                onChange={(event) => {
                  void handleFile(slot.field, slot.kind, event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={!state.pendingUrl || state.uploading || pending}
                onClick={() => save(slot.field, state.pendingUrl, `${slot.label} saved.`)}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              {state.pendingUrl || state.localPreview ? (
                <button
                  type="button"
                  disabled={state.uploading || pending}
                  onClick={() => patchSlot(slot.field, EMPTY_SLOT)}
                  className="rounded-md px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                disabled={!saved || pending || state.uploading}
                onClick={() => {
                  if (!window.confirm(`Reset the ${slot.label.toLowerCase()} to the default?`)) {
                    return;
                  }
                  save(slot.field, null, `${slot.label} reset to default.`);
                }}
                className="ml-auto rounded-md px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                title={`Default: ${fallback}`}
              >
                Reset to default
              </button>
            </div>
          </div>
        );
      })}
    </MapSiteDashboardPanel>
  );
}
