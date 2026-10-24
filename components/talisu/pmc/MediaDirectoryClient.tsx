"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import type { PmcMediaRow } from "@/lib/talisu/pmc-media-directory";

type MediaLabels = ReturnType<typeof useT>["pmc"]["media"];

/** One shared panel explaining the exposure syndication cycle (bottom sheet on mobile). */
function SyndicationPanel({ t, onClose }: { t: MediaLabels; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pmc-syndication-title"
      data-testid="pmc-syndication-panel"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#06182f]/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0069CF]">{t.panelKicker}</p>
            <h2 id="pmc-syndication-title" className="mt-1 text-2xl font-black tracking-tight text-neutral-900">
              {t.panelTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            ✕
          </button>
        </div>
        <p className="mt-4 text-[16px] leading-relaxed text-neutral-700">{t.panelBody}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-[#e8f3ff] px-3 py-3">
            <p className="text-2xl font-black text-[#0069CF]">7</p>
            <p className="text-[12px] font-semibold text-neutral-600">{t.panelOn}</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 px-3 py-3">
            <p className="text-2xl font-black text-neutral-700">3</p>
            <p className="text-[12px] font-semibold text-neutral-600">{t.panelOff}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="pmc-syndication-close"
          className="mt-6 w-full rounded-full bg-[#06182f] px-5 py-3 text-sm font-bold text-white hover:bg-black"
        >
          {t.close}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Searchable directory. Rows arrive URL-free from the server; every row and
 * every "Syndicated <location>" pill opens the same syndication panel.
 */
export default function MediaDirectoryClient({ rows: allRows }: { rows: PmcMediaRow[] }) {
  const t = useT().pmc.media;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (m) => m.outlet.toLowerCase().includes(q) || m.location.toLowerCase().includes(q),
    );
  }, [query, allRows]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          className="w-full max-w-sm rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-[#0069CF] focus:ring-2 focus:ring-[#0069CF]/20"
        />
        <span className="text-sm font-semibold text-neutral-500">
          {t.count.replace("{n}", String(rows.length))}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-[14px]" data-testid="pmc-media-table">
          <thead className="bg-[#06182f] text-[12px] uppercase tracking-wide text-white">
            <tr>
              <th className="w-12 px-3 py-3" aria-label="Flag" />
              <th className="px-3 py-3">{t.outlet}</th>
              <th className="hidden px-3 py-3 sm:table-cell">{t.location}</th>
              <th className="px-3 py-3">{t.website}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr
                key={`${m.outlet}-${m.location}`}
                className={`cursor-pointer border-t border-black/5 hover:bg-[#e8f3ff] ${
                  i % 2 ? "bg-[#f5f9fe]" : "bg-white"
                }`}
                onClick={() => setOpen(true)}
              >
                <td className="px-3 py-2.5 text-xl leading-none">{m.flag}</td>
                <td className="px-3 py-2.5 font-semibold text-neutral-900">
                  {m.outlet}
                  <span className="block text-[12px] font-normal text-neutral-500 sm:hidden">{m.location}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-neutral-600 sm:table-cell">{m.location}</td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    data-testid="pmc-syndicated"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(true);
                    }}
                    className="inline-flex items-center rounded-full bg-[#0069CF]/10 px-3 py-1 text-left text-[13px] font-semibold text-[#0069CF] hover:bg-[#0069CF]/20"
                  >
                    {syndicatedLabel(t.syndicated, m.location)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? <SyndicationPanel t={t} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function syndicatedLabel(template: string, location: string): string {
  return template.replace("{location}", location);
}
