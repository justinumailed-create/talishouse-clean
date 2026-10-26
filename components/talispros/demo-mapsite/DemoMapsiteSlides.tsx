"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Time each live Mapsite stays on screen, and the crossfade length. */
export const DEMO_SLIDE_INTERVAL_MS = 5500;
export const DEMO_SLIDE_FADE_MS = 1400;

/**
 * Gentle auto-rotating crossfade of claimed Mapsite screenshots.
 * Not a flipbook: every slide sits in the same frame and the next one fades
 * in over the last. Personal details are burned out of the image files
 * themselves, never covered by CSS. Reduced motion: no auto-rotation; the
 * dots and feature links still switch slides.
 */
export default function DemoMapsiteSlides({
  slides,
  alts,
  active,
  onSelect,
  held,
  label,
}: {
  slides: readonly string[];
  alts: readonly string[];
  active: number;
  onSelect: (index: number) => void;
  /** Pause rotation while a feature link is being chosen. */
  held: boolean;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);
  const onSelectRef = useRef(onSelect);
  const activeRef = useRef(active);
  onSelectRef.current = onSelect;
  activeRef.current = active;
  const paused = held || hovered;

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      onSelectRef.current((activeRef.current + 1) % slides.length);
    }, DEMO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const total = slides.length;

  return (
    <div
      className="demo-hero__slides relative h-full w-full overflow-hidden bg-[#e7e4de]"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      data-testid="demo-hero-slides"
      data-active-slide={active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {slides.map((src, index) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none"
          style={{ opacity: index === active ? 1 : 0, transitionDuration: `${DEMO_SLIDE_FADE_MS}ms` }}
          aria-hidden={index === active ? undefined : true}
          data-testid="demo-hero-slide"
        >
          <Image
            src={src}
            alt={alts[index] ?? ""}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="object-cover object-center"
          />
        </div>
      ))}
      {total > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {slides.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`${index + 1} / ${total}`}
              aria-current={index === active ? "true" : undefined}
              data-testid="demo-hero-dot"
              onClick={() => onSelect(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" : "w-1.5 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
