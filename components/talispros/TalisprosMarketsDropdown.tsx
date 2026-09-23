"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";

export default function TalisprosMarketsDropdown({
  triggerClassName = "text-[11px] tracking-[0.08em] text-neutral-500 hover:text-neutral-900 transition-colors",
  menuAlign = "center",
}: {
  triggerClassName?: string;
  menuAlign?: "center" | "end";
}) {
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
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Markets
      </button>

      <div
        className={`absolute top-full z-30 pt-2 ${
          open ? "block" : "hidden group-hover:block"
        } ${menuAlign === "end" ? "" : "left-1/2 -translate-x-1/2"}`}
        style={
          menuAlign === "end"
            ? { left: "auto", right: 0, width: "18rem", maxWidth: "none" }
            : undefined
        }
        data-markets-menu=""
      >
        <div className="min-w-[18rem] bg-[#e2e5ea] px-5 py-4 text-center shadow-sm">
          <div className="space-y-3">
            {TALISPROS_MARKET_OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setOpen(false)}
                className="block text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <span className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  {option.label}
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs tracking-[0.04em] leading-snug">
                  {option.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
