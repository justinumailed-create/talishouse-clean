"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Full cycle: Talispros™ dominates (~75%), brief TalisU™ (~25%). */
export const TALIS_BRAND_FLIP_TALISPROS_MS = 6000;
export const TALIS_BRAND_FLIP_TALISU_MS = 2000;
export const TALIS_BRAND_FLIP_CYCLE_MS =
  TALIS_BRAND_FLIP_TALISPROS_MS + TALIS_BRAND_FLIP_TALISU_MS;

export type TalisBrandId = "talispros" | "talisu";

export function talisBrandForCycleElapsed(elapsedMs: number): TalisBrandId {
  const t =
    ((elapsedMs % TALIS_BRAND_FLIP_CYCLE_MS) + TALIS_BRAND_FLIP_CYCLE_MS) %
    TALIS_BRAND_FLIP_CYCLE_MS;
  return t < TALIS_BRAND_FLIP_TALISPROS_MS ? "talispros" : "talisu";
}

type TalisBrandFlipProps = {
  tagline: string;
  className?: string;
};

/**
 * Flip/rotate wordmark beside the blue header logo.
 * Talispros™ stays longer; TalisU™ is a shorter glimpse.
 */
export default function TalisBrandFlip({
  tagline,
  className = "",
}: TalisBrandFlipProps) {
  const [brand, setBrand] = useState<TalisBrandId>("talispros");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setBrand("talispros");
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    const schedule = (next: TalisBrandId, delay: number) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setBrand(next);
        if (next === "talispros") {
          schedule("talisu", TALIS_BRAND_FLIP_TALISPROS_MS);
        } else {
          schedule("talispros", TALIS_BRAND_FLIP_TALISU_MS);
        }
      }, delay);
    };
    schedule("talisu", TALIS_BRAND_FLIP_TALISPROS_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [reduceMotion]);

  const href = brand === "talispros" ? "/" : "/talisu";
  const label = brand === "talispros" ? "Talispros™" : "TalisU™";

  return (
    <div className={`min-w-0 leading-tight ${className}`}>
      <div
        className="relative h-[1.35em] overflow-hidden perspective-[400px] text-base font-bold tracking-wide sm:text-lg"
        aria-live="polite"
      >
        <Link
          key={brand}
          href={href}
          className={
            reduceMotion
              ? "block text-white hover:text-white/95"
              : "talis-brand-flip-face block text-white hover:text-white/95"
          }
        >
          {brand === "talispros" ? "Talispros™" : "TalisU™"}
        </Link>
      </div>
      <div className="text-[12px] text-white/95 sm:text-[13px]">{tagline}</div>
      <span className="sr-only">Brand: {label}</span>
    </div>
  );
}
