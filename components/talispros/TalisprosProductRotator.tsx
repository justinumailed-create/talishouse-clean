"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { TALISPROS_HOME_PRODUCTS } from "@/lib/talispros/start-content";

const ROTATION_INTERVAL_MS = 4_500;

export default function TalisprosProductRotator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (reducedMotion.matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % TALISPROS_HOME_PRODUCTS.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative aspect-video overflow-hidden bg-neutral-100">
      {TALISPROS_HOME_PRODUCTS.map((product, index) => {
        const active = index === activeIndex;
        return (
          <Image
            key={product.id}
            src={product.imageSrc}
            alt={active ? `${product.label} product` : ""}
            fill
            priority={index === 0}
            aria-hidden={!active}
            className={`absolute inset-0 object-cover transition-opacity duration-700 ${
              active ? "opacity-100" : "opacity-0"
            }`}
            sizes="(min-width: 1200px) 1200px, calc(100vw - 350px)"
          />
        );
      })}
      <p
        className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm sm:right-4 sm:top-4"
        aria-live="polite"
      >
        {TALISPROS_HOME_PRODUCTS[activeIndex]?.label}
      </p>
    </div>
  );
}
