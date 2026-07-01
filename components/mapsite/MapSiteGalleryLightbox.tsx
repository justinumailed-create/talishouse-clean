"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MapSiteGalleryDisplayItem } from "@/lib/mapsite-gallery";

interface MapSiteGalleryLightboxProps {
  items: MapSiteGalleryDisplayItem[];
  propertyTitle: string;
}

const GALLERY_OPEN_CLASS = "mapsite-gallery-open";

export default function MapSiteGalleryLightbox({
  items,
  propertyTitle,
}: MapSiteGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [thumbSize, setThumbSize] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    const updateThumbSize = () => {
      const nextSize = node.clientHeight - 16;
      setThumbSize(nextSize > 0 ? nextSize : null);
    };

    updateThumbSize();
    const observer = new ResizeObserver(updateThumbSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current == null ? null : (current - 1 + items.length) % items.length
    );
  }, [items.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current == null ? null : (current + 1) % items.length
    );
  }, [items.length]);

  useEffect(() => {
    if (activeIndex == null) {
      return;
    }

    document.body.classList.add(GALLERY_OPEN_CLASS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      } else if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove(GALLERY_OPEN_CLASS);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, closeLightbox, showNext, showPrevious]);

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-sm text-neutral-400 px-6 text-center">
        Gallery images coming soon
      </div>
    );
  }

  const activeItem = activeIndex != null ? items[activeIndex] : null;

  const lightbox =
    activeIndex != null && activeItem ? (
      <div
        className="fixed inset-0 z-[2147483000] flex flex-col bg-black/95"
        role="dialog"
        aria-modal="true"
        aria-label={`${propertyTitle} gallery`}
      >
        <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
          <p className="text-sm text-white/80">
            {activeIndex + 1} / {items.length}
          </p>
          <button
            type="button"
            onClick={closeLightbox}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center min-h-0 px-14 sm:px-20 pb-6">
          {items.length > 1 ? (
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          ) : null}

          <div
            className="relative w-full h-full max-w-6xl flex flex-col"
            onClick={closeLightbox}
          >
            <div
              className="relative flex-1 min-h-0"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={activeItem.url}
                alt={activeItem.description || `${propertyTitle} ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
            {activeItem.description ? (
              <p className="mt-4 px-2 text-center text-sm text-white/85 leading-relaxed">
                {activeItem.description}
              </p>
            ) : null}
          </div>

          {items.length > 1 ? (
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        ref={scrollRef}
        className="h-full w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory p-2 [scrollbar-width:thin]"
      >
        <div className="flex h-full gap-2 w-max min-h-0">
          {items.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              style={{
                width: thumbSize ?? 200,
                height: thumbSize ?? 200,
                flexShrink: 0,
              }}
              className="relative shrink-0 snap-start rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              aria-label={
                item.description
                  ? `Open gallery image: ${item.description}`
                  : `Open gallery image ${index + 1}`
              }
            >
              <Image
                src={item.url}
                alt={item.description || `${propertyTitle} ${index + 1}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 40vh, 320px"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>

      {mounted && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
