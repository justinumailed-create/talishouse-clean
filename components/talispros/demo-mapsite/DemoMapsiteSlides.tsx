"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Time each live Mapsite stays on screen, and the crossfade length. */
export const DEMO_SLIDE_INTERVAL_MS = 5500;
export const DEMO_SLIDE_FADE_MS = 1400;

/**
 * Gentle auto-rotating crossfade of live Mapsite screenshots (Ralf, Oct 26).
 * Not a flipbook: every slide sits in the same frame and the next one fades
 * in over the last. Personal details (FAST Code, address, owner name, phone,
 * email) are burned out of the image files themselves, never covered by CSS.
 * Reduced motion: no auto-rotation; the dots still switch slides.
 */
export default function DemoMapsiteSlides({
  slides,
  altTemplate,
  label,
}: {
  slides: readonly string[];
  /** "… {n} of {total} …" */
  altTemplate: string;
  label: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setActive((current) => (current + 1) % slides.length);
    }, DEMO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  const total = slides.length;

  return (
    <div
      className="demo-hero__slides relative h-full w-full overflow-hidden bg-[#e9e6e0]"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      data-testid="demo-hero-slides"
      data-active-slide={active}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
            alt={altTemplate.replace("{n}", String(index + 1)).replace("{total}", String(total))}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover object-top"
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
              onClick={() => setActive(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-5 bg-neutral-900/80" : "w-1.5 bg-neutral-900/30 hover:bg-neutral-900/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
