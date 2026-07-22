"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Pin from "@/components/talismaps/pin/Pin";
import {
  PIN_BORDER_OPTIONS,
  PIN_CATEGORY_BADGE_OPTIONS,
  PIN_ICON_OPTIONS,
  type HomePinLocationValues,
} from "./home-pin-types";

interface TalisMapsPinStyleSectionProps {
  values: Pick<
    HomePinLocationValues,
    | "futurePinColor"
    | "futurePinIcon"
    | "futurePinBorder"
    | "futurePinLabel"
    | "futurePinWhiteCenter"
    | "futurePinAnimated"
    | "futurePinCategoryBadge"
  >;
  customLogo: File | null;
  onChange: (values: Partial<HomePinLocationValues>) => void;
  onCustomLogoChange: (file: File | null) => void;
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-neutral-500">{label}</label>
  );
}

export default function TalisMapsPinStyleSection({
  values,
  customLogo,
  onChange,
  onCustomLogoChange,
}: TalisMapsPinStyleSectionProps) {
  const customLogoInputRef = useRef<HTMLInputElement>(null);
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!customLogo) {
      setCustomLogoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(customLogo);
    setCustomLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [customLogo]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
      <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
        TalisMaps™ PIN Style
      </h3>
      <p className="mb-4 mt-1 text-xs text-neutral-500">
        Personalize your Home PIN. Uncheck white center to use flag-style markers
        where your icon fills the colored circle (like MapSite™ reference pins).
      </p>

      <div className="mb-5 flex items-center justify-center rounded-xl border border-neutral-200 bg-white py-6">
        <Pin
          pinColor={values.futurePinColor || "#1A73E8"}
          pinIcon={values.futurePinIcon || "flag"}
          whiteCenter={values.futurePinWhiteCenter}
          categoryBadge={values.futurePinCategoryBadge}
          pinAnimation={values.futurePinAnimated ? "pulse" : "none"}
          customLogoUrl={customLogoPreview}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel label="Pin Color" />
          <input
            type="color"
            value={values.futurePinColor || "#1f2937"}
            onChange={(event) => onChange({ futurePinColor: event.target.value })}
            className="h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-white"
          />
        </div>

        <div>
          <FieldLabel label="Pin Border" />
          <select
            value={values.futurePinBorder || "solid"}
            onChange={(event) => onChange({ futurePinBorder: event.target.value })}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900"
          >
            {PIN_BORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel label="Pin Icon" />
          <select
            value={values.futurePinIcon || "flag"}
            onChange={(event) => onChange({ futurePinIcon: event.target.value })}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900"
          >
            {PIN_ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel label="Pin Label" />
          <input
            type="text"
            value={values.futurePinLabel || ""}
            onChange={(event) => onChange({ futurePinLabel: event.target.value })}
            placeholder="Home PIN"
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel label="Custom Logo" />
          <button
            type="button"
            onClick={() => customLogoInputRef.current?.click()}
            className="flex h-11 w-full items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white px-4 text-sm text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">
              {customLogo?.name || "Click to upload custom PIN logo"}
            </span>
            {customLogo ? (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onCustomLogoChange(null);
                  if (customLogoInputRef.current) customLogoInputRef.current.value = "";
                }}
                className="shrink-0 text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </span>
            ) : null}
          </button>
          <input
            ref={customLogoInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => onCustomLogoChange(event.target.files?.[0] ?? null)}
          />
          {customLogoPreview ? (
            <div className="relative mt-3 aspect-square w-20 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <Image
                src={customLogoPreview}
                alt="Custom PIN logo preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
        </div>

        <div>
          <FieldLabel label="Category Badge" />
          <select
            value={values.futurePinCategoryBadge || ""}
            onChange={(event) =>
              onChange({
                futurePinCategoryBadge: event.target.value || null,
              })
            }
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900"
          >
            {PIN_CATEGORY_BADGE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4">
            <input
              type="checkbox"
              checked={values.futurePinWhiteCenter}
              onChange={(event) =>
                onChange({ futurePinWhiteCenter: event.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">
              Classic white-center marker
            </span>
          </label>
          <p className="text-xs text-neutral-500">
            Off = flag-style pin with a large white icon on your brand color.
          </p>

          <label className="flex h-11 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4">
            <input
              type="checkbox"
              checked={values.futurePinAnimated}
              onChange={(event) => onChange({ futurePinAnimated: event.target.checked })}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Animated Marker</span>
          </label>
        </div>
      </div>
    </div>
  );
}
