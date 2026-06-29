"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface MapSiteGalleryLightboxProps {
  images: string[];
  propertyTitle: string;
}

export default function MapSiteGalleryLightbox({
  images,
  propertyTitle,
}: MapSiteGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-sm text-neutral-400 px-6 text-center">
        Gallery images coming soon
      </div>
    );
  }

  function openLightbox(index: number) {
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
  }

  function showPrevious() {
    setActiveIndex((current) =>
      current == null ? null : (current - 1 + images.length) % images.length
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current == null ? null : (current + 1) % images.length
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openLightbox(0)}
        className="relative w-full h-full bg-neutral-100 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900/20"
        aria-label="Open image gallery lightbox"
      >
        <Image
          src={images[0]}
          alt={`${propertyTitle} gallery`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </button>

      {activeIndex != null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 p-2 text-white/80 hover:text-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <div className="relative w-full max-w-5xl aspect-[4/3]">
            <Image
              src={images[activeIndex]}
              alt={`${propertyTitle} ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 p-2 text-white/80 hover:text-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
