"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { talisuHref } from "@/lib/talisu/talisu-links";

/** Brushed-metal face shared with the home EXPLORE TRANSACTION STRUCTURES buttons. */
const METAL_BG = [
  "linear-gradient(155deg, #f4f4f4 0%, #d8d8d8 16%, #a8a8a8 38%, #ececec 52%, #b5b5b5 72%, #cfcfcf 88%, #9e9e9e 100%)",
  "repeating-linear-gradient(95deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 1px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 3px)",
].join(", ");

/**
 * Ralf (Oct 18): the home page EXPLORE TRANSACTION STRUCTURES section
 * (Conventional, Lease-to-Own, Fractionalization, Tokenization) resized for the
 * working pages (/talisu/discuss, Webster /talisu/engage). The explanation
 * opens BELOW the buttons, inline (no overlay), so the page never bleeds past
 * the bottom of the screen.
 *
 * - `openId` / `onOpenChange`: controlled; on /talisu/discuss the open
 *   structure is also the one recorded with the form.
 * - `requireSelection`: a click on the open button keeps it open (discuss form).
 * - `learnMore`: Webster page — a "Share a Project Vision →" link in the
 *   open panel (the checkout button sits beside Webster's card).
 */
export default function TransactionStructurePicker({
  openId,
  onOpenChange,
  requireSelection = false,
  learnMore = false,
  testId = "structure-picker",
}: {
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  requireSelection?: boolean;
  learnMore?: boolean;
  testId?: string;
}) {
  const t = useT();
  const baseId = useId();
  const sections = t.home.ownershipSections;
  const open = sections.find((s) => s.id === openId) ?? null;

  return (
    <section data-testid={testId} aria-label={t.home.structuresTagline}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        {t.home.structuresTagline}
      </p>
      <div
        className="rounded-2xl border border-neutral-400/50 bg-gradient-to-b from-[#c8c8c8] via-[#b0b0b0] to-[#9a9a9a] p-2.5"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {sections.map((section) => {
            const isOpen = openId === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? `${baseId}-panel-${section.id}` : undefined}
                data-testid={`${testId}-${section.id}`}
                data-structure-id={section.id}
                onClick={() =>
                  onOpenChange(isOpen && !requireSelection ? null : section.id)
                }
                className={[
                  "group relative h-14 w-full overflow-hidden rounded-xl border border-white/55",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.22),0_4px_10px_rgba(0,0,0,0.2)]",
                  "transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                  isOpen ? "ring-2 ring-[#046BD9] scale-[0.98]" : "hover:brightness-105 active:scale-[0.98]",
                ].join(" ")}
                style={{ backgroundImage: METAL_BG }}
              >
                <span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/20"
                  aria-hidden
                />
                <span className="relative z-10 flex h-full items-center justify-center px-2 text-center text-[13px] font-semibold tracking-wide text-neutral-900 sm:text-[14px]">
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>

        {open ? (
          <div
            id={`${baseId}-panel-${open.id}`}
            role="region"
            aria-label={open.title}
            data-testid={`${testId}-panel`}
            className="relative mt-3 rounded-xl border border-neutral-200/90 bg-[#fafaf7] px-4 py-3.5 text-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
          >
            {/* Bubble pointer up toward the button row (explanations open below). */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-full h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[10px] border-x-transparent border-b-[#fafaf7]"
              style={{
                left: `${((sections.findIndex((s) => s.id === open.id) + 0.5) / sections.length) * 100}%`,
              }}
            />
            <h3 className="text-[15px] font-semibold tracking-wide text-neutral-900">
              {open.title}
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-800">{open.body}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-700">{open.result}</p>
            {learnMore && open.learnMoreHref ? (
              <div className="mt-3">
                <Link
                  href={talisuHref(open.learnMoreHref)}
                  data-testid={`${testId}-learn-more`}
                  className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#046BD9] underline-offset-2 hover:underline"
                >
                  {t.bot.getHelp}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Uncontrolled picker for server pages (Webster /talisu/engage). */
export function TransactionStructurePickerStandalone({
  initialOpenId = null,
  learnMore = true,
  testId,
}: {
  initialOpenId?: string | null;
  learnMore?: boolean;
  testId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  return (
    <TransactionStructurePicker
      openId={openId}
      onOpenChange={setOpenId}
      learnMore={learnMore}
      testId={testId}
    />
  );
}
