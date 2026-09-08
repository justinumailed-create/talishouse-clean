"use client";

import {
  type JarlbergSlotState,
} from "@/lib/talisbooks/jarlberg-template";

type Props = {
  slots: JarlbergSlotState;
  disabled?: boolean;
  onChange: (next: JarlbergSlotState) => void;
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

export default function JarlbergTemplateFields({
  slots,
  disabled,
  onChange,
  onPickFile,
}: Props) {
  const patch = (partial: Partial<JarlbergSlotState>) =>
    onChange({ ...slots, ...partial });

  return (
    <div className="mt-5 space-y-3">
      <FieldBox label="Front cover — image and title, same type layout">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.frontImage)}
          onClick={() =>
            onPickFile((file) => patch({ frontImage: file }))
          }
        />
        <textarea
          rows={3}
          disabled={disabled}
          value={slots.frontTitle}
          onChange={(event) => patch({ frontTitle: event.target.value })}
          className="w-full resize-none rounded-xl bg-white px-3 py-2 text-[15px] tracking-tight outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Back cover — black layout, replace agent photo and details">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.backAgentImage)}
          onClick={() =>
            onPickFile((file) => patch({ backAgentImage: file }))
          }
        />
        <input
          disabled={disabled}
          value={slots.broughtBy}
          onChange={(event) => patch({ broughtBy: event.target.value })}
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

      <FieldBox label="Page 1 — dome stays; map uses your Mapsite™ pin">
        <input
          disabled={disabled}
          value={slots.welcomeTitle}
          onChange={(event) => patch({ welcomeTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      {slots.photoCaptions.map((caption, index) => {
        const page = index + 2;
        return (
          <FieldBox
            key={page}
            label={`Page ${page} — replaceable photo and caption`}
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
              className="w-full resize-none rounded-xl bg-white px-3 py-2 text-[15px] tracking-tight outline-none disabled:opacity-40"
            />
          </FieldBox>
        );
      })}

      <FieldBox label="Page 9 — four replaceable images">
        <div className="grid grid-cols-2 gap-2">
          {slots.neighbourImages.map((file, index) => (
            <AddButton
              key={index}
              disabled={disabled}
              hasFile={Boolean(file)}
              onClick={() =>
                onPickFile((picked) => {
                  const neighbourImages = slots.neighbourImages.slice();
                  neighbourImages[index] = picked;
                  patch({ neighbourImages });
                })
              }
            />
          ))}
        </div>
        <input
          disabled={disabled}
          value={slots.neighboursTitle}
          onChange={(event) => patch({ neighboursTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Page 10 — left image, right copy">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.investorImage)}
          onClick={() =>
            onPickFile((file) => patch({ investorImage: file }))
          }
        />
        <input
          disabled={disabled}
          value={slots.investorTitle}
          onChange={(event) => patch({ investorTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <textarea
          rows={8}
          disabled={disabled}
          value={slots.investorBody}
          onChange={(event) => patch({ investorBody: event.target.value })}
          className="w-full resize-none rounded-xl bg-white px-3 py-2 text-[14px] leading-relaxed outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.investorSignoff}
          onChange={(event) => patch({ investorSignoff: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Page 11 — image and overlay copy">
        <AddButton
          disabled={disabled}
          hasFile={Boolean(slots.partingImage)}
          onClick={() =>
            onPickFile((file) => patch({ partingImage: file }))
          }
        />
        <input
          disabled={disabled}
          value={slots.partingTitle}
          onChange={(event) => patch({ partingTitle: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.partingCaption}
          onChange={(event) => patch({ partingCaption: event.target.value })}
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>
    </div>
  );
}
