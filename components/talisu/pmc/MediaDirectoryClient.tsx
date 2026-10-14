"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { IframeModal } from "@/components/talisu/pmc/IframeLink";
import { PMC_MEDIA_DIRECTORY, flagEmoji, type PmcMediaOutlet } from "@/lib/talisu/pmc-media-directory";

/** Searchable directory; every outlet opens in an iframe modal on click. */
export default function MediaDirectoryClient() {
  const t = useT().pmc.media;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<PmcMediaOutlet | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PMC_MEDIA_DIRECTORY;
    return PMC_MEDIA_DIRECTORY.filter(
      (m) => m.outlet.toLowerCase().includes(q) || m.location.toLowerCase().includes(q),
    );
  }, [query]);

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
                className={`border-t border-black/5 ${i % 2 ? "bg-[#f5f9fe]" : "bg-white"} ${
                  m.url ? "cursor-pointer hover:bg-[#e8f3ff]" : ""
                }`}
                onClick={() => m.url && setOpen(m)}
              >
                <td className="px-3 py-2.5 text-xl leading-none">{flagEmoji(m.iso)}</td>
                <td className="px-3 py-2.5 font-semibold text-neutral-900">
                  {m.outlet}
                  <span className="block text-[12px] font-normal text-neutral-500 sm:hidden">{m.location}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-neutral-600 sm:table-cell">{m.location}</td>
                <td className="px-3 py-2.5">
                  {m.url ? (
                    <a
                      href={m.url}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(m);
                      }}
                      className="inline-flex items-center gap-1.5 break-all text-[#0069CF] hover:underline"
                    >
                      {m.url.replace(/^https?:\/\//, "")}
                      <span className="rounded-full bg-[#0069CF]/10 px-2 py-0.5 text-[11px] font-bold no-underline">
                        {t.open}
                      </span>
                    </a>
                  ) : (
                    <span className="text-[13px] text-neutral-400">{t.noSite}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open?.url ? (
        <IframeModal url={open.url} title={`${open.outlet} — ${open.location}`} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}
