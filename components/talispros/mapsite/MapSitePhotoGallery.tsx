"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

interface MapSitePhotoGalleryProps {
  title: string;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Full-viewport closable photo gallery for MapSite™ listing media.
 */
export default function MapSitePhotoGallery({
  title,
  images,
  initialIndex = 0,
  onClose,
}: MapSitePhotoGalleryProps) {
  const titleId = useId();
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0))
  );

  const count = images.length;
  const current = images[index] ?? images[0];

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setIndex((currentIndex) => (currentIndex - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setIndex((currentIndex) => (currentIndex + 1) % count);
  }, [count]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goNext, goPrev, onClose]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 id={titleId} className="truncate text-sm font-medium sm:text-base">
            {title}
          </h2>
          <p className="text-xs text-white/60">
            {index + 1} / {count}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl leading-none transition hover:bg-white/20"
          aria-label="Close gallery"
        >
          ×
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-default"
          aria-label="Close gallery"
          onClick={onClose}
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-8">
          <div className="pointer-events-auto relative h-full w-full max-w-6xl">
            <Image
              src={current}
              alt={`${title} photo ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
              priority
            />
          </div>
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl transition hover:bg-white/20 sm:left-5"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl transition hover:bg-white/20 sm:right-5"
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:justify-center sm:px-6">
          {images.map((src, thumbIndex) => {
            const selected = thumbIndex === index;
            return (
              <button
                key={`${src}-${thumbIndex}`}
                type="button"
                onClick={() => setIndex(thumbIndex)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  selected
                    ? "ring-white"
                    : "ring-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Show photo ${thumbIndex + 1}`}
                aria-current={selected ? "true" : undefined}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
