"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Crop, ImagePlus, Replace, Trash2, X } from "lucide-react";

type AspectPreset = "page" | "wide" | "square" | "free";

const ASPECT_PRESETS: Array<{ id: AspectPreset; label: string; ratio: number | null }> = [
  { id: "page", label: "Page", ratio: 3 / 4 },
  { id: "wide", label: "Wide", ratio: 16 / 9 },
  { id: "square", label: "Square", ratio: 1 },
  { id: "free", label: "Free", ratio: null },
];

interface TalisBooksImageFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

async function cropImageToDataUrl(input: {
  src: string;
  /** Normalized crop rect in image pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
}): Promise<string> {
  const image = await loadImage(input.src);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(input.width));
  const height = Math.max(1, Math.round(input.height));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable.");
  }
  ctx.drawImage(
    image,
    input.x,
    input.y,
    input.width,
    input.height,
    0,
    0,
    width,
    height,
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

function CropDialog({
  src,
  onCancel,
  onApply,
}: {
  src: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const titleId = useId();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<AspectPreset>("page");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadImage(src)
      .then((image) => {
        if (!cancelled) {
          setNatural({ w: image.naturalWidth, h: image.naturalHeight });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load this image for cropping.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const aspect = ASPECT_PRESETS.find((entry) => entry.id === preset)?.ratio ?? null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    setOffset({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const applyCrop = async () => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const stageRect = stage.getBoundingClientRect();
      const frame = stage.querySelector(
        "[data-crop-frame]",
      ) as HTMLElement | null;
      const img = stage.querySelector("img");
      if (!frame || !img) {
        throw new Error("Crop frame missing.");
      }
      const frameRect = frame.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const scaleX = natural.w / imgRect.width;
      const scaleY = natural.h / imgRect.height;
      const x = Math.max(0, (frameRect.left - imgRect.left) * scaleX);
      const y = Math.max(0, (frameRect.top - imgRect.top) * scaleY);
      const width = Math.min(natural.w - x, frameRect.width * scaleX);
      const height = Math.min(natural.h - y, frameRect.height * scaleY);
      void stageRect;
      const dataUrl = await cropImageToDataUrl({ src, x, y, width, height });
      onApply(dataUrl);
    } catch {
      setError("Crop failed. Try another image.");
    } finally {
      setBusy(false);
    }
  };

  const frameStyle = (() => {
    if (aspect == null) {
      return { width: "88%", height: "72%" };
    }
    // Fit aspect frame inside stage.
    const maxW = 88;
    const maxH = 78;
    const stageAspect = maxW / maxH;
    if (aspect > stageAspect) {
      return { width: `${maxW}%`, height: `${maxW / aspect}%` };
    }
    return { width: `${maxH * aspect}%`, height: `${maxH}%` };
  })();

  return (
    <div
      className="talisbooks-viewer-image-field__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="talisbooks-viewer-image-field__dialog-card">
        <header className="talisbooks-viewer-image-field__dialog-head">
          <h3 id={titleId}>Crop image</h3>
          <button
            type="button"
            className="talisbooks-viewer-image-field__icon-btn"
            onClick={onCancel}
            aria-label="Close crop"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="talisbooks-viewer-image-field__presets" role="group" aria-label="Aspect ratio">
          {ASPECT_PRESETS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={[
                "talisbooks-viewer-image-field__preset",
                preset === entry.id
                  ? "talisbooks-viewer-image-field__preset--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                setPreset(entry.id);
                setOffset({ x: 0, y: 0 });
                setZoom(1);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          className="talisbooks-viewer-image-field__crop-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          />
          <div
            data-crop-frame
            className="talisbooks-viewer-image-field__crop-frame"
            style={frameStyle}
            aria-hidden="true"
          />
        </div>

        <label className="talisbooks-viewer-image-field__zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        {error ? <p className="talisbooks-viewer-image-field__error">{error}</p> : null}

        <div className="talisbooks-viewer-image-field__dialog-actions">
          <button type="button" className="talisbooks-viewer-image-field__btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="talisbooks-viewer-image-field__btn talisbooks-viewer-image-field__btn--primary"
            onClick={() => void applyCrop()}
            disabled={busy}
          >
            {busy ? "Applying…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TalisBooksImageField({
  id,
  label,
  value = "",
  onChange,
}: TalisBooksImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch {
      setError("Could not open that file.");
    }
  };

  return (
    <div className="talisbooks-viewer-image-field">
      <div className="talisbooks-viewer-image-field__label-row">
        <span className="talisbooks-viewer-live-edit__label">{label}</span>
      </div>

      <div className="talisbooks-viewer-image-field__preview">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span className="talisbooks-viewer-image-field__placeholder">No image</span>
        )}
      </div>

      <div className="talisbooks-viewer-image-field__actions">
        <button
          type="button"
          className="talisbooks-viewer-image-field__btn"
          onClick={pickFile}
        >
          {value ? <Replace className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
          {value ? "Replace" : "Upload"}
        </button>
        <button
          type="button"
          className="talisbooks-viewer-image-field__btn"
          onClick={() => {
            if (!value) {
              pickFile();
              return;
            }
            setCropSrc(value);
          }}
          disabled={!value}
        >
          <Crop className="h-3.5 w-3.5" />
          Crop
        </button>
        <button
          type="button"
          className="talisbooks-viewer-image-field__btn"
          onClick={() => onChange("")}
          disabled={!value}
          aria-label={`Remove ${label}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <input
        id={id}
        ref={inputRef}
        type="file"
        accept="image/*"
        className="talisbooks-image-field-file-input"
        onChange={(event) => void onFileChange(event)}
      />

      {error ? <p className="talisbooks-viewer-image-field__error">{error}</p> : null}

      {cropSrc ? (
        <CropDialog
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onApply={(dataUrl) => {
            onChange(dataUrl);
            setCropSrc(null);
          }}
        />
      ) : null}
    </div>
  );
}
