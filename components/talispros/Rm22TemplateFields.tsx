"use client";

import {
  RM22_PRODUCTS,
  type Rm22SlotState,
} from "@/lib/talisbooks/rm22-template";

type Props = {
  slots: Rm22SlotState;
  disabled?: boolean;
  onChange: (next: Rm22SlotState) => void;
  onPickFile: (onFile: (file: File) => void) => void;
};

function FieldBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] bg-[#f5f5f7] p-3">
      <p className="text-[12px] font-medium text-neutral-500">{label}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function AddButton({
  disabled,
  hasFile,
  onClick,
}: {
  disabled?: boolean;
  hasFile: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-950 ring-1 ring-black/[0.06] disabled:opacity-40"
    >
      {hasFile ? "Replace image" : "Add image"}
    </button>
  );
}

export default function Rm22TemplateFields({
  slots,
  disabled,
  onChange,
  onPickFile,
}: Props) {
  const patch = (partial: Partial<Rm22SlotState>) =>
    onChange({ ...slots, ...partial });

  return (
    <div className="mt-5 space-y-3">
      <FieldBox label="Page 2 product sheet — pick exactly one">
        <div
          role="radiogroup"
          aria-label="Product sheet"
          className="grid grid-cols-3 gap-2"
        >
          {RM22_PRODUCTS.map((product) => {
            const selected = slots.productId === product.id;
            return (
              <label
                key={product.id}
                className={`flex cursor-pointer flex-col items-center rounded-2xl bg-white px-2 py-3 text-center ring-1 ${
                  selected
                    ? "ring-neutral-950"
                    : "ring-black/[0.06]"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <input
                  type="radio"
                  name="rm22-product"
                  value={product.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => patch({ productId: product.id })}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.href}
                  alt=""
                  className="h-14 w-full rounded-lg object-cover"
                />
                <span className="mt-2 text-[12px] font-medium text-neutral-950">
                  {product.label}
                </span>
              </label>
            );
          })}
        </div>
      </FieldBox>

      <FieldBox label="Front cover — image, title, and price line">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.frontImage)}
          onClick={() => onPickFile((file) => patch({ frontImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.frontTitle}
          onChange={(event) => patch({ frontTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontSubtitle}
          onChange={(event) => patch({ frontSubtitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontPriceLine}
          onChange={(event) => patch({ frontPriceLine: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontTagline}
          onChange={(event) => patch({ frontTagline: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Back cover — agent photo and contact">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.backAgentImage)}
          onClick={() => onPickFile((file) => patch({ backAgentImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.backKicker}
          onChange={(event) => patch({ backKicker: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.agentName}
          onChange={(event) => patch({ agentName: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.agentPhone}
          onChange={(event) => patch({ agentPhone: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Intro spread — replaceable photo, title, and caption">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.introImage)}
          onClick={() => onPickFile((file) => patch({ introImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.introTitle}
          onChange={(event) => patch({ introTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.introCaption}
          onChange={(event) => patch({ introCaption: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      {slots.photoCaptions.map((caption, index) => (
        <FieldBox
          key={index}
          label={`Photo ${index + 1} — replaceable image and caption`}
        >
          <AddButton
            disabled={disabled}
            hasFile={Boolean(slots.photoImages[index])}
            onClick={() =>
              onPickFile((file) => {
                const photoImages = slots.photoImages.slice();
                photoImages[index] = file;
                patch({ photoImages });
              })
            }
          />
          <textarea
            rows={2}
            disabled={disabled}
            value={caption}
            onChange={(event) => {
              const photoCaptions = slots.photoCaptions.slice();
              photoCaptions[index] = event.target.value;
              patch({ photoCaptions });
            }}
            placeholder="Caption"
            className="w-full resize-none rounded-xl bg-white px-3 py-2 text-[15px] tracking-tight outline-none disabled:opacity-40"
          />
        </FieldBox>
      ))}

      <FieldBox label="Intrinsic Value — left image, right copy">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.intrinsicImage)}
          onClick={() => onPickFile((file) => patch({ intrinsicImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.intrinsicTitle}
          onChange={(event) => patch({ intrinsicTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.intrinsicCaption}
          onChange={(event) => patch({ intrinsicCaption: event.target.value })}
          placeholder="Image caption"
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <textarea
          rows={8}
          disabled={disabled}
          value={slots.intrinsicBody}
          onChange={(event) => patch({ intrinsicBody: event.target.value })}
          placeholder="Replace the placeholder copy with the real story."
          className="w-full resize-none rounded-xl bg-white px-3 py-2 text-[14px] leading-relaxed outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.intrinsicSignoff}
          onChange={(event) => patch({ intrinsicSignoff: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Outro — image, title, and caption">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.outroImage)}
          onClick={() => onPickFile((file) => patch({ outroImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.outroTitle}
          onChange={(event) => patch({ outroTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.outroCaption}
          onChange={(event) => patch({ outroCaption: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>
    </div>
  );
}
