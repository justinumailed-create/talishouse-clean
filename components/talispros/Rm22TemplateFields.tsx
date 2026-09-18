"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { mapsiteAgencyLogoUrl } from "@/lib/talispros/mapsite-listing-media";
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
  RM22_VIEWER_COVER_ASPECT,
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
    <div className="min-w-0 rounded-[14px] bg-[#f5f5f7] p-2.5">
      <p className="text-[11px] font-medium leading-snug text-neutral-500">
        {label}
      </p>
      <div className="mt-1.5 space-y-1.5">{children}</div>
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
      className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-950 ring-1 ring-black/[0.06] disabled:opacity-40"
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
      ? "relative mx-auto block w-full overflow-hidden rounded-lg bg-black disabled:opacity-40"
      : "relative block w-full overflow-hidden rounded-lg bg-white disabled:opacity-40";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={frame}
      style={{
        aspectRatio: aspect,
        containerType: "size",
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
  objectTop = false,
}: {
  src: string | null;
  fit?: "cover" | "contain";
  emptyColor?: string;
  objectTop?: boolean;
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
              : `absolute inset-0 h-full w-full object-cover${objectTop ? " object-top" : ""}`
          }
        />
      ) : null}
    </>
  );
}

function BleedPreview({
  file,
  srcUrl,
  title,
  caption,
  disabled,
  onPick,
}: {
  file: File | null;
  srcUrl?: string | null;
  title?: string;
  caption: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  const uploadUrl = useObjectUrl(file);
  const src = uploadUrl || srcUrl || null;
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
      <AddButton
        disabled={disabled}
        hasFile={Boolean(file || srcUrl)}
        onClick={onPick}
      />
    </div>
  );
}

function IntrinsicPreview({
  file,
  srcUrl,
  title,
  caption,
  body,
  signoff,
  disabled,
  onPick,
}: {
  file: File | null;
  srcUrl?: string | null;
  title: string;
  caption: string;
  body: string;
  signoff: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  const uploadUrl = useObjectUrl(file);
  const src = uploadUrl || srcUrl || null;
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
      <AddButton
        disabled={disabled}
        hasFile={Boolean(file || srcUrl)}
        onClick={onPick}
      />
    </div>
  );
}

const COVER_MERGE_FADE: CSSProperties = {
  height: "50%",
  background:
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.82) 72%, rgba(0,0,0,0.94) 100%)",
};

const COVER_COPY_STACK: CSSProperties = {
  bottom: "2.6%",
  left: "6%",
  right: "6%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "0.28em",
  fontSize: "4.2cqh",
};

const COVER_LINE: CSSProperties = {
  margin: 0,
  width: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1.05,
  color: "#ffffff",
};

function FitCoverLine({
  text,
  style,
}: {
  text: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      const computed = Number.parseFloat(getComputedStyle(el).fontSize);
      let size = Number.isFinite(computed) ? computed : 10;
      const min = 4;
      while (el.scrollWidth > el.clientWidth + 0.5 && size > min) {
        size -= 0.2;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, [text, style]);
  return (
    <div ref={ref} style={{ ...COVER_LINE, ...style }}>
      {text}
    </div>
  );
}

function CoverPreview({
  file,
  srcUrl,
  placeholderSrc,
  disabled,
  onPick,
  children,
  fit = "cover",
}: {
  file: File | null;
  srcUrl?: string | null;
  placeholderSrc?: string;
  disabled?: boolean;
  onPick: () => void;
  children: React.ReactNode;
  fit?: "cover" | "contain";
}) {
  const uploadUrl = useObjectUrl(file);
  const src = uploadUrl || srcUrl || placeholderSrc || null;
  const showCopy = Boolean(file) || !srcUrl;
  return (
    <div className="space-y-2">
      <DocumentPreview
        aspect={RM22_VIEWER_COVER_ASPECT}
        variant="cover"
        disabled={disabled}
        onPick={onPick}
      >
        <PhotoSlot
          src={src}
          fit={fit}
          emptyColor="#000000"
          objectTop={fit === "cover"}
        />
        {showCopy ? (
          <>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={COVER_MERGE_FADE}
        />
        <div
          className="pointer-events-none absolute inset-x-[6%] text-center"
          style={COVER_COPY_STACK}
        >
          {children}
        </div>
          </>
        ) : null}
      </DocumentPreview>
      <AddButton
        disabled={disabled}
        hasFile={Boolean(file || srcUrl)}
        onClick={onPick}
      />
    </div>
  );
}

function BackCoverPreview({
  file,
  srcUrl,
  logoFile,
  logoUrl,
  placeholderSrc,
  disabled,
  onPick,
  children,
}: {
  file: File | null;
  srcUrl?: string | null;
  logoFile: File | null;
  logoUrl?: string | null;
  placeholderSrc?: string;
  disabled?: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  const uploadUrl = useObjectUrl(file);
  const logoUploadUrl = useObjectUrl(logoFile);
  const src = uploadUrl || srcUrl || placeholderSrc || null;
  const logoSrc = logoUploadUrl || mapsiteAgencyLogoUrl(logoUrl);
  const showCopy = Boolean(file) || !srcUrl;
  return (
    <div className="space-y-2">
      <DocumentPreview
        aspect={RM22_VIEWER_COVER_ASPECT}
        variant="cover"
        disabled={disabled}
        onPick={onPick}
      >
          <PhotoSlot src={src} fit="cover" emptyColor="#000000" objectTop />
          {showCopy ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt=""
                className="pointer-events-none absolute object-contain"
                style={{
                  top: "3.6%",
                  left: "5.5%",
                  width: "22%",
                  height: "12%",
                  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={COVER_MERGE_FADE}
              />
              <div
                className="pointer-events-none absolute inset-x-[6%] text-center"
                style={COVER_COPY_STACK}
              >
                {children}
              </div>
            </>
          ) : null}
        </DocumentPreview>
      <AddButton
        disabled={disabled}
        hasFile={Boolean(file || srcUrl)}
        onClick={onPick}
      />
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

      <div className="grid grid-cols-2 gap-2">
      <FieldBox label="Front cover — photo and caption">
        <CoverPreview
          file={slots.frontImage}
          srcUrl={slots.frontImageUrl}
          fit="cover"
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ frontImage: file }))}
        >
          {slots.frontTitle.trim() ? (
            <FitCoverLine
              text={slots.frontTitle.trim()}
              style={{ fontWeight: 700, fontSize: "1.05em" }}
            />
          ) : null}
          {slots.frontSubtitle.trim() ? (
            <FitCoverLine
              text={slots.frontSubtitle.trim()}
              style={{
                fontStyle: "italic",
                fontSize: "0.95em",
                color: RM22_COLOR.lime,
              }}
            />
          ) : null}
          {slots.frontPriceLine.trim() ? (
            <FitCoverLine
              text={slots.frontPriceLine.trim()}
              style={{ fontWeight: 500, fontSize: "0.95em" }}
            />
          ) : null}
          {slots.frontTagline.trim() ? (
            <FitCoverLine
              text={slots.frontTagline.trim()}
              style={{
                fontStyle: "italic",
                fontSize: "0.78em",
                color: RM22_COLOR.lime,
              }}
            />
          ) : null}
        </CoverPreview>
        <input
          disabled={disabled}
          value={slots.frontTitle}
          onChange={(event) => patch({ frontTitle: event.target.value })}
          placeholder="Street, community"
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontSubtitle}
          onChange={(event) => patch({ frontSubtitle: event.target.value })}
          placeholder="*A prime Estuary Location*"
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontPriceLine}
          onChange={(event) => patch({ frontPriceLine: event.target.value })}
          placeholder="From $20,000 per acre"
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.frontTagline}
          onChange={(event) => patch({ frontTagline: event.target.value })}
          placeholder="Available with or without Tiny Home, turn key optional"
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="Back cover — agent photo and contact">
        <BackCoverPreview
          file={slots.backAgentImage}
          srcUrl={slots.backAgentImageUrl}
          logoFile={slots.agencyLogo}
          logoUrl={slots.agencyLogoUrl}
          placeholderSrc={RM22_ASSETS.agent}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ backAgentImage: file }))}
        >
          {slots.backKicker.trim() ? (
            <FitCoverLine
              text={slots.backKicker.trim()}
              style={{ fontWeight: 700, fontSize: "1.05em" }}
            />
          ) : null}
          <FitCoverLine
            text={slots.agentName.trim() || "Your Name"}
            style={{ fontWeight: 500, fontSize: "0.95em" }}
          />
          {slots.agentPhone.trim() ? (
            <FitCoverLine
              text={`Please message me @ ${slots.agentPhone.trim()}`}
              style={{ fontStyle: "italic", fontSize: "0.78em" }}
            />
          ) : null}
        </BackCoverPreview>
        <input
          disabled={disabled}
          value={slots.backKicker}
          onChange={(event) => patch({ backKicker: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.agentName}
          onChange={(event) => patch({ agentName: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.agentPhone}
          onChange={(event) => patch({ agentPhone: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
      </FieldBox>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <FieldBox label="Intro spread — replaceable photo, title, and caption">
        <BleedPreview
          file={slots.introImage}
          srcUrl={slots.introImageUrl}
          title={slots.introTitle}
          caption={slots.introCaption}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ introImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.introTitle}
          onChange={(event) => patch({ introTitle: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.introCaption}
          onChange={(event) => patch({ introCaption: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      {slots.photoCaptions.map((caption, index) => (
        <FieldBox
          key={index}
          label={`Photo ${index + 1} — replaceable image and caption`}
        >
          <BleedPreview
            file={slots.photoImages[index] ?? null}
            srcUrl={slots.photoImageUrls[index] ?? null}
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
            className="w-full resize-none rounded-lg bg-white px-2 py-1.5 text-[12px] leading-snug tracking-tight outline-none disabled:opacity-40"
          />
        </FieldBox>
      ))}

      <FieldBox label="Intrinsic Value — second-to-last interior (portrait left, copy right)">
        <IntrinsicPreview
          file={slots.intrinsicImage}
          srcUrl={slots.intrinsicImageUrl}
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
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.intrinsicCaption}
          onChange={(event) => patch({ intrinsicCaption: event.target.value })}
          placeholder="Image caption"
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <textarea
          rows={4}
          disabled={disabled}
          value={slots.intrinsicBody}
          onChange={(event) => patch({ intrinsicBody: event.target.value })}
          placeholder="Replace the placeholder copy with the real story."
          className="w-full resize-none rounded-lg bg-white px-2 py-1.5 text-[12px] leading-snug outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.intrinsicSignoff}
          onChange={(event) => patch({ intrinsicSignoff: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
      </FieldBox>

      <FieldBox label="The Parting Shot…! — last interior before the back cover">
        <BleedPreview
          file={slots.outroImage}
          srcUrl={slots.outroImageUrl}
          title={slots.outroTitle}
          caption={slots.outroCaption}
          disabled={disabled}
          onPick={() => onPickFile((file) => patch({ outroImage: file }))}
        />
        <input
          disabled={disabled}
          value={slots.outroTitle}
          onChange={(event) => patch({ outroTitle: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
        <input
          disabled={disabled}
          value={slots.outroCaption}
          onChange={(event) => patch({ outroCaption: event.target.value })}
          className="w-full rounded-lg bg-white px-2 py-1.5 text-[13px] outline-none disabled:opacity-40"
        />
      </FieldBox>
      </div>
    </div>
  );
}
