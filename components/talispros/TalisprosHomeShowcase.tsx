"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  HOME_OWNERSHIP_BANNER_TITLE,
  HOME_OWNERSHIP_SECTIONS,
} from "@/lib/talispros/ownership-models";
import HomeMountainMotion from "@/components/talispros/HomeMountainMotion";
import OwnershipLearnMoreForm from "@/components/talispros/OwnershipLearnMoreForm";

/**
 * Homepage gate right column: looping mountain motion on the upper half with a
 * readable title overlay; lower half holds four brushed-metal square buttons.
 * Clicking a heading opens a high-contrast popover with that model's body +
 * result copy.
 */
export default function TalisprosHomeShowcase() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [contactTopic, setContactTopic] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const baseId = useId();

  const openSection =
    HOME_OWNERSHIP_SECTIONS.find((section) => section.id === openId) ?? null;

  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (!openId) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [openId, close]);

  return (
    <aside
      ref={rootRef}
      className="relative flex min-h-[42vh] w-full flex-1 flex-col overflow-hidden bg-neutral-900 lg:h-full lg:min-h-0 lg:border-l lg:border-[#dedede]"
      aria-label="Ownership models"
    >
      {/* Upper: looping mountain motion + title */}
      <div
        className="relative min-h-[240px] flex-1 basis-[58%]"
        onClick={openId ? close : undefined}
        role={openId ? "presentation" : undefined}
      >
        <HomeMountainMotion />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-gradient-to-b from-black/60 via-black/30 to-transparent px-4 pb-12 pt-4 sm:px-5 sm:pt-5">
          <h2 className="text-center text-[15px] font-semibold leading-snug tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-[17px] md:text-[18px]">
            {HOME_OWNERSHIP_BANNER_TITLE}
          </h2>
        </div>
      </div>

      {/* Lower: metallic square buttons + popover */}
      <div className="relative z-10 flex-none border-t border-neutral-400/50 bg-gradient-to-b from-[#c8c8c8] via-[#b0b0b0] to-[#9a9a9a] px-3 py-3 sm:px-4 sm:py-3.5">
        {openSection ? (
          <div
            id={`${baseId}-popover-${openSection.id}`}
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${baseId}-title-${openSection.id}`}
            className="absolute bottom-[calc(100%+0.65rem)] left-3 right-3 z-20 mx-auto max-h-[min(48vh,22rem)] max-w-[36rem] overflow-y-auto rounded-2xl border border-neutral-200/90 bg-[#fafaf7] px-4 py-4 text-neutral-900 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:left-4 sm:right-4 sm:px-5 sm:py-5"
          >
            {/* Bubble pointer toward the button row */}
            <span
              className="pointer-events-none absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-[#fafaf7] drop-shadow-sm"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <h2
                id={`${baseId}-title-${openSection.id}`}
                className="text-[16px] font-semibold tracking-wide text-neutral-900 sm:text-[17px]"
              >
                {openSection.title}
              </h2>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-full px-2 py-0.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-800"
                aria-label={`Close ${openSection.title} details`}
              >
                ✕
              </button>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-neutral-800 sm:text-[14.5px]">
              {openSection.body}
            </p>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-neutral-700 sm:text-[14.5px]">
              {openSection.result}
            </p>
            {openSection.learnMoreContact ? (
              <p className="mt-3.5">
                <button
                  type="button"
                  onClick={() => setContactTopic(openSection.title)}
                  className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#046BD9] underline-offset-2 transition hover:underline sm:text-[14.5px]"
                >
                  {openSection.learnMoreLabel ?? "Learn More"}
                  <span aria-hidden>→</span>
                </button>
              </p>
            ) : openSection.learnMoreHref ? (
              <p className="mt-3.5">
                <Link
                  href={openSection.learnMoreHref}
                  className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#046BD9] underline-offset-2 transition hover:underline sm:text-[14.5px]"
                >
                  {openSection.learnMoreLabel ?? "Learn More"}
                  <span aria-hidden>→</span>
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {HOME_OWNERSHIP_SECTIONS.map((section) => {
            const isOpen = openId === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-expanded={isOpen}
                aria-controls={
                  isOpen ? `${baseId}-popover-${section.id}` : undefined
                }
                onClick={() =>
                  setOpenId((current) =>
                    current === section.id ? null : section.id
                  )
                }
                className={[
                  "group relative aspect-square w-full overflow-hidden rounded-xl",
                  "border border-white/55",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.22),0_6px_14px_rgba(0,0,0,0.22)]",
                  "transition duration-200",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                  isOpen
                    ? "ring-2 ring-neutral-800/70 scale-[0.98]"
                    : "hover:brightness-105 active:scale-[0.98]",
                ].join(" ")}
                style={{
                  backgroundImage: [
                    "linear-gradient(155deg, #f4f4f4 0%, #d8d8d8 16%, #a8a8a8 38%, #ececec 52%, #b5b5b5 72%, #cfcfcf 88%, #9e9e9e 100%)",
                    "repeating-linear-gradient(95deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 1px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 3px)",
                  ].join(", "),
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/20"
                  aria-hidden
                />
                <span className="relative z-10 flex h-full items-center justify-center px-2 text-center text-[12px] font-semibold tracking-wide text-neutral-900 sm:text-[13px] md:text-[14px]">
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <OwnershipLearnMoreForm
        topic={contactTopic || "Conventional"}
        open={Boolean(contactTopic)}
        onClose={() => setContactTopic(null)}
      />
    </aside>
  );
}
