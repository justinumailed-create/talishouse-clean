"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TALISPROS_MARKET_OPTIONS } from "@/lib/talispros/markets";
import { useT } from "@/lib/i18n/client";

export default function TalisprosMarketsDropdown({
  triggerClassName = "text-[11px] tracking-[0.08em] text-neutral-500 hover:text-neutral-900 transition-colors",
  menuAlign = "center",
  menuDirection = "down",
}: {
  triggerClassName?: string;
  menuAlign?: "center" | "end";
  /** `up` opens above the trigger (homepage corner). */
  menuDirection?: "down" | "up";
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
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

  const opensUp = menuDirection === "up";

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
        {t.home.corner.markets}
      </button>

      <div
        className={`absolute z-30 ${
          opensUp ? "bottom-full pb-2" : "top-full pt-2"
        } ${open ? "block" : "hidden group-hover:block"} ${
          menuAlign === "end" ? "" : "left-1/2 -translate-x-1/2"
        }`}
        style={
          menuAlign === "end"
            ? { left: "auto", right: 0, width: "18rem", maxWidth: "none" }
            : undefined
        }
        data-markets-menu=""
        data-markets-menu-direction={menuDirection}
      >
        <div className="min-w-[18rem] bg-[#e2e5ea] px-5 py-4 text-center shadow-sm">
          <div className="space-y-3">
            {TALISPROS_MARKET_OPTIONS.map((option, index) => (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setOpen(false)}
                className="block text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <span className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  {t.home.segments[index]?.label ?? option.label}
                </span>
                <span className="mt-1 block whitespace-nowrap text-xs tracking-[0.04em] leading-snug">
                  {t.home.segments[index]?.title ?? option.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
