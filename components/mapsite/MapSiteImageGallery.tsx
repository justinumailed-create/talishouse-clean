"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface MapSiteImageGalleryProps {
  images: string[];
  propertyTitle: string;
}

export default function MapSiteImageGallery({
  images,
  propertyTitle,
}: MapSiteImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
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
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <h2 className="text-lg font-semibold text-neutral-900 mb-5">Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => openLightbox(index)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 text-left focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              <Image
                src={src}
                alt={`${propertyTitle} ${index + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </button>
          ))}
        </div>
      </div>

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

          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-4 p-2 text-white/80 hover:text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

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

          <button
            type="button"
            onClick={showNext}
            className="absolute right-4 p-2 text-white/80 hover:text-white"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </section>
  );
}
