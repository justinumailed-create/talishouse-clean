"use client";

import { useEffect, useState } from "react";
import {
  RM22_ASSETS,
  RM22_PRODUCTS,
  defaultRm22IntrinsicBody,
  rm22ProductById,
  type Rm22SlotState,
} from "@/lib/talisbooks/rm22-template";
import {
  RM22_BLEED_CAPTION,
  RM22_BLEED_TITLE,
  RM22_BLEED_TITLE_SHADOW,
  RM22_COLOR,
  RM22_INTRINSIC_BODY,
  RM22_INTRINSIC_CAPTION,
  RM22_INTRINSIC_IMAGE,
  RM22_INTRINSIC_SIGNOFF,
  RM22_INTRINSIC_TITLE,
  RM22_SPREAD_PAGE,
  boxToPagePercent,
  fontSizeCqh,
} from "@/lib/talisbooks/rm22-layout";

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

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function DocumentPreview({
  aspect,
  disabled,
  onPick,
  children,
  variant = "spread",
}: {
  aspect: string;
  disabled?: boolean;
  onPick: () => void;
  children: React.ReactNode;
  variant?: "spread" | "cover";
}) {
  const frame =
    variant === "cover"
      ? "relative mx-auto block max-w-full overflow-hidden rounded-xl bg-black disabled:opacity-40"
      : "relative block w-full overflow-hidden rounded-xl bg-white disabled:opacity-40";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={frame}
      style={{
        aspectRatio: aspect,
        containerType: "size",
        ...(variant === "cover"
          ? { height: "min(28rem, 70vw)", width: "auto" }
          : {}),
      }}
    >
      {children}
    </button>
  );
}

function PhotoSlot({
  src,
  fit = "cover",
  emptyColor = RM22_COLOR.lime,
}: {
  src: string | null;
  fit?: "cover" | "contain";
  emptyColor?: string;
}) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: emptyColor }}
        aria-hidden="true"
      />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={
            fit === "contain"
              ? "absolute inset-0 h-full w-full object-contain"
              : "absolute inset-0 h-full w-full object-cover"
          }
        />
      ) : null}
    </>
  );
}

function BleedPreview({
  file,
  title,
  caption,
  disabled,
  onPick,
}: {
  file: File | null;
  title?: string;
  caption: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  const src = useObjectUrl(file);
  const heading = title?.trim() || "";
  const titlePos = boxToPagePercent(RM22_BLEED_TITLE.box, RM22_SPREAD_PAGE);
  const captionPos = boxToPagePercent(RM22_BLEED_CAPTION.box, RM22_SPREAD_PAGE);
  return (
    <div className="space-y-2">
      <DocumentPreview aspect="1920 / 1080" disabled={disabled} onPick={onPick}>
        <PhotoSlot src={src} />
        {heading ? (
          <p
            className="talisbooks-viewer-page__template-bleed-title pointer-events-none"
            style={{
              ...titlePos,
              color: RM22_BLEED_TITLE.style.color,
              fontFamily: RM22_BLEED_TITLE.style.fontFamily,
              fontSize: fontSizeCqh(RM22_BLEED_TITLE.style.fontSize),
              fontWeight: RM22_BLEED_TITLE.style.fontWeight,
              lineHeight: fontSizeCqh(RM22_BLEED_TITLE.style.lineHeight),
              textShadow: RM22_BLEED_TITLE_SHADOW,
            }}
          >
            {heading}
          </p>
        ) : null}
        <div
          className="talisbooks-viewer-page__template-caption pointer-events-none"
          style={captionPos}
        >
          {caption.trim() ? <p>{caption.trim()}</p> : null}
        </div>
      </DocumentPreview>
      <AddButton disabled={disabled} hasFile={Boolean(file)} onClick={onPick} />
    </div>
  );
}

function IntrinsicPreview({
  file,
  title,
  caption,
  body,
  signoff,
  disabled,
  onPick,
}: {
  file: File | null;
  title: string;
  caption: string;
  body: string;
  signoff: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  const src = useObjectUrl(file);
  const imagePos = boxToPagePercent(RM22_INTRINSIC_IMAGE.box, RM22_SPREAD_PAGE);
  const captionPos = boxToPagePercent(RM22_INTRINSIC_CAPTION.box, RM22_SPREAD_PAGE);
  const titlePos = boxToPagePercent(RM22_INTRINSIC_TITLE.box, RM22_SPREAD_PAGE);
  const bodyPos = boxToPagePercent(RM22_INTRINSIC_BODY.box, RM22_SPREAD_PAGE);
  const signoffPos = boxToPagePercent(RM22_INTRINSIC_SIGNOFF.box, RM22_SPREAD_PAGE);
  return (
    <div className="space-y-2">
      <DocumentPreview aspect="1920 / 1080" disabled={disabled} onPick={onPick}>
        <div className="absolute inset-0 bg-white" />
        <div className="absolute overflow-hidden" style={imagePos}>
          <PhotoSlot src={src} />
        </div>
        <div
          className="talisbooks-viewer-page__template-caption pointer-events-none"
          style={captionPos}
        >
          {caption.trim() ? <p>{caption.trim()}</p> : null}
        </div>
        <h2
          className="talisbooks-viewer-page__split-title pointer-events-none"
          style={{
            ...titlePos,
            fontSize: fontSizeCqh(RM22_INTRINSIC_TITLE.style.fontSize),
            lineHeight: fontSizeCqh(RM22_INTRINSIC_TITLE.style.lineHeight),
          }}
        >
          {title.trim() || "Intrinsic Value"}
        </h2>
        <p
          className="talisbooks-viewer-page__split-body pointer-events-none"
          style={{
            ...bodyPos,
            fontSize: fontSizeCqh(RM22_INTRINSIC_BODY.style.fontSize),
            lineHeight: fontSizeCqh(RM22_INTRINSIC_BODY.style.lineHeight),
          }}
        >
          {body}
        </p>
        {signoff.trim() ? (
          <p
            className="talisbooks-viewer-page__split-signoff pointer-events-none"
            style={{
              ...signoffPos,
              fontSize: fontSizeCqh(RM22_INTRINSIC_SIGNOFF.style.fontSize),
              lineHeight: fontSizeCqh(RM22_INTRINSIC_SIGNOFF.style.lineHeight),
            }}
          >
            {signoff.trim()}
          </p>
        ) : null}
      </DocumentPreview>
      <AddButton disabled={disabled} hasFile={Boolean(file)} onClick={onPick} />
    </div>
  );
}

function CoverPreview({
  file,
  placeholderSrc,
  disabled,
  onPick,
  children,
  fit = "cover",
  overlay = "fade",
}: {
  file: File | null;
  placeholderSrc?: string;
  disabled?: boolean;
  onPick: () => void;
  children: React.ReactNode;
  fit?: "cover" | "contain";
  overlay?: "fade" | "band";
}) {
  const uploadUrl = useObjectUrl(file);
  const src = uploadUrl || placeholderSrc || null;
  const band = overlay === "band";
  return (
    <div className="space-y-2">
      <DocumentPreview
        aspect="1080 / 1920"
        variant="cover"
        disabled={disabled}
        onPick={onPick}
      >
        <PhotoSlot src={src} fit={fit} emptyColor="#000000" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={
            band
              ? { height: "32%", background: RM22_COLOR.captionOverlay }
              : {
                  height: "42%",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0), #000000 55%)",
                }
          }
        />
        <div
          className="pointer-events-none absolute inset-x-[8%] text-center"
          style={
            band
              ? {
                  bottom: "4%",
                  left: "8%",
                  right: "8%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  gap: "0.35em",
                }
              : { bottom: "6%" }
          }
        >
          {children}
        </div>
      </DocumentPreview>
      <AddButton disabled={disabled} hasFile={Boolean(file)} onClick={onPick} />
    </div>
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
      <FieldBox label="First interior — pick exactly one product sheet">
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
                  onChange={() => {
                    const previousDefault = defaultRm22IntrinsicBody({
                      productLabel: rm22ProductById(slots.productId).label,
                      lotTitle: slots.frontSubtitle,
                      address: slots.frontTitle,
                    });
                    const nextDefault = defaultRm22IntrinsicBody({
                      productLabel: product.label,
                      lotTitle: slots.frontSubtitle,
                      address: slots.frontTitle,
                    });
                    const body = slots.intrinsicBody.trim();
                    patch({
                      productId: product.id,
                      intrinsicBody:
                        !body || body === previousDefault
                          ? nextDefault
                          : slots.intrinsicBody,
                    });
                  }}
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

      <FieldBox label="Front cover — photo and caption (address, lot line, price)">
        <CoverPreview
          file={slots.frontImage}
          fit="contain"
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ frontImage: file }))}
        >
          {slots.frontTitle.trim() ? (
            <p className="text-[13px] font-bold leading-tight text-white">
              {slots.frontTitle.trim()}
            </p>
          ) : null}
          {slots.frontSubtitle.trim() ? (
            <p
              className="mt-1 text-[12px] italic"
              style={{ color: RM22_COLOR.lime }}
            >
              {slots.frontSubtitle.trim()}
            </p>
          ) : null}
          {slots.frontPriceLine.trim() ? (
            <p className="mt-1 text-[11px] text-white">
              {slots.frontPriceLine.trim()}
            </p>
          ) : null}
          {slots.frontTagline.trim() ? (
            <p
              className="mt-1 text-[10px]"
              style={{ color: RM22_COLOR.lime }}
            >
              {slots.frontTagline.trim()}
            </p>
          ) : null}
        </CoverPreview>
        <input
          disabled={disabled}
          value={slots.frontTitle}
          onChange={(event) => patch({ frontTitle: event.target.value })}
          placeholder="Street, community"
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontSubtitle}
          onChange={(event) => patch({ frontSubtitle: event.target.value })}
          placeholder="*A prime Estuary Location*"
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontPriceLine}
          onChange={(event) => patch({ frontPriceLine: event.target.value })}
          placeholder="From $20,000 per acre"
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontTagline}
          onChange={(event) => patch({ frontTagline: event.target.value })}
          placeholder="Available with or without Tiny Home, turn key optional"
          className="w-full rounded-xl bg-white px-3 py-2 text-[15px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Back cover — agent photo and contact">
        <CoverPreview
          file={slots.backAgentImage}
          placeholderSrc={RM22_ASSETS.agent}
          fit="cover"
          overlay="band"
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ backAgentImage: file }))}
        >
          {slots.backKicker.trim() ? (
            <p
              className="m-0 text-[15px] font-semibold leading-tight"
              style={{ color: "#ffffff" }}
            >
              {slots.backKicker.trim()}
            </p>
          ) : null}
          <p
            className="m-0 text-[11px] font-medium leading-tight"
            style={{ color: "#ffffff" }}
          >
            {slots.agentName.trim() || "Your Name"}
          </p>
          {slots.agentPhone.trim() ? (
            <p
              className="m-0 text-[10px] italic leading-tight"
              style={{ color: "#ffffff" }}
            >
              Please message me @ {slots.agentPhone.trim()}
            </p>
          ) : null}
        </CoverPreview>
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
        <BleedPreview
          file={slots.introImage}
          title={slots.introTitle}
          caption={slots.introCaption}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ introImage: file }))}
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
          <BleedPreview
            file={slots.photoImages[index] ?? null}
            caption={caption}
            disabled={disabled}
            onPick={() =>
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

      <FieldBox label="Intrinsic Value — second-to-last interior (portrait left, copy right)">
        <IntrinsicPreview
          file={slots.intrinsicImage}
          title={slots.intrinsicTitle}
          caption={slots.intrinsicCaption}
          body={slots.intrinsicBody}
          signoff={slots.intrinsicSignoff}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ intrinsicImage: file }))}
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

      <FieldBox label="The Parting Shot…! — last interior before the back cover">
        <BleedPreview
          file={slots.outroImage}
          title={slots.outroTitle}
          caption={slots.outroCaption}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ outroImage: file }))}
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
