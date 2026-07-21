"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";

export default function TalisprosMarketsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] tracking-[0.08em] text-neutral-500 hover:text-neutral-900 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Markets
      </button>

      <div
        className={`absolute left-1/2 top-full z-20 -translate-x-1/2 pt-2 ${
          open ? "block" : "hidden group-hover:block"
        }`}
      >
        <div className="min-w-[15rem] bg-[#e2e5ea] px-5 py-4 text-center shadow-sm">
          <div className="space-y-3">
            {TALISPROS_MARKET_OPTIONS.map((option) => (
              <Link
                key={option.label}
                href={option.href}
                onClick={() => setOpen(false)}
                className="block whitespace-nowrap text-xs tracking-[0.04em] leading-snug text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
