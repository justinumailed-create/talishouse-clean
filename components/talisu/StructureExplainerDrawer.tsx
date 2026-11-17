"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/** Home-page transaction structure copy, opened as a side panel. */
export default function StructureExplainerDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const sections = t.home.ownershipSections;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={open ? undefined : true}
      data-testid="discuss-structures-drawer"
      data-open={open ? "1" : "0"}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label={t.contactForm.structuresClose}
        className={`absolute inset-0 bg-neutral-950/35 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="region"
        aria-label={t.contactForm.structuresPanelTitle}
        className={`absolute inset-y-0 right-0 flex w-[min(100%,26rem)] flex-col bg-[#fafaf7] text-neutral-950 shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <h2 className="m-0 text-[18px] font-semibold text-neutral-950">
            {t.contactForm.structuresPanelTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-testid="discuss-structures-close"
            className="rounded-md px-2 py-1 text-[14px] font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {t.contactForm.structuresClose}
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {sections.map((section) => (
            <section key={section.id} data-testid={`discuss-structure-${section.id}`}>
              <h3 className="text-[16px] font-semibold text-neutral-950">{section.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-800">{section.body}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">{section.result}</p>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
