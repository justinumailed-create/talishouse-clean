"use client";

import { useEffect, useState } from "react";
import OwnerEbookEditor from "@/components/talispros/ebook-editor/OwnerEbookEditor";
import { loadOwnerEbookAction } from "@/app/talispros/mapsite/ebook-editor-actions";
import { chatEbookContextAction, chatEbookFastCodesAction, chatEbookListAction } from "@/app/chat/actions";
import type { OwnerEbookDetails, OwnerEbookPage } from "@/lib/talisbooks/owner-ebook-editor-model";
import { IconBook, IconClose } from "./icons";

/** Full-screen sheet hosting the existing eBook editor (same access checks as the Mapsite dashboard). */
export default function EbookSheet({ fastCode, bookId, title, backHref, onClose }: {
  fastCode: string; bookId: string; title: string; backHref: string; onClose: () => void;
}) {
  const [state, setState] = useState<{ mapsiteId: string; book: OwnerEbookDetails; pages: OwnerEbookPage[] } | { error: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ctx = await chatEbookContextAction(fastCode);
      if (!ctx.ok) { if (!cancelled) setState({ error: ctx.error }); return; }
      const loaded = await loadOwnerEbookAction({ fastCode, bookId });
      if (cancelled) return;
      setState(loaded.success ? { mapsiteId: ctx.mapsiteId, book: loaded.book, pages: loaded.pages } : { error: loaded.error });
    })();
    return () => { cancelled = true; };
  }, [fastCode, bookId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6" data-testid="ebook-sheet">
      <div className="flex h-[100dvh] w-full flex-col bg-white md:h-[90dvh] md:max-w-4xl! md:rounded-3xl md:shadow-2xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-[#e5e9f0] px-4 pb-3" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0E9F6E] to-[#1E4ED8] text-white"><IconBook /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-semibold">{title}</div>
            <div className="text-[12px] uppercase text-[#64748b]">eBook editor · {fastCode}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[#f1f5f9] p-2" aria-label="Close editor"><IconClose /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
          {state === null ? <div className="py-10 text-center text-[14px] text-[#64748b]">Loading editor…</div> : null}
          {state && "error" in state ? <div className="rounded-xl bg-[#fef2f2] p-4 text-[14px] text-[#b91c1c]">{state.error}</div> : null}
          {state && "book" in state ? (
            <OwnerEbookEditor fastCode={fastCode} mapsiteId={state.mapsiteId} backHref={backHref} initialBook={state.book} initialPages={state.pages} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Pick an eBook to share: only FAST Codes the sender may edit. */
export function EbookPicker({ onClose, onPick }: { onClose: () => void; onPick: (fastCode: string, bookId: string) => void }) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [any, setAny] = useState(false);
  const [fastCode, setFastCode] = useState("");
  const [books, setBooks] = useState<Array<{ id: string; title: string; coverImageUrl: string | null }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void chatEbookFastCodesAction().then((r) => {
      if (!r.ok) { setError(r.error); setCodes([]); return; }
      setCodes(r.codes); setAny(r.any);
      if (r.codes.length === 1) void load(r.codes[0]);
    });
  }, []);

  async function load(code: string) {
    setFastCode(code); setLoading(true); setError(null); setBooks(null);
    const r = await chatEbookListAction(code);
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setBooks(r.books);
  }

  const noAccess = codes !== null && codes.length === 0 && !any;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl md:max-w-md! md:rounded-3xl" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><div className="text-[17px] font-semibold">Share an eBook</div><button type="button" onClick={onClose} aria-label="Close"><IconClose /></button></div>
        {noAccess ? <div className="rounded-xl bg-[#f8fafc] p-3 text-[14px] text-[#475569]">Your account doesn’t have the eBook privilege.</div> : null}
        {codes && codes.length > 1 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {codes.map((c) => <button key={c} type="button" onClick={() => void load(c)} className={`rounded-full border px-3 py-1 text-[13px] font-semibold uppercase ${fastCode === c ? "border-[#1E4ED8] bg-[#eef3ff] text-[#1E4ED8]" : "border-[#dbe3ef]"}`}>{c}</button>)}
          </div>
        ) : null}
        {any ? (
          <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (fastCode.trim()) void load(fastCode.trim()); }}>
            <input value={fastCode} onChange={(e) => setFastCode(e.target.value)} placeholder="FAST Code" className="flex-1 rounded-xl border border-[#dbe3ef] px-3 py-2 text-[16px] uppercase outline-none focus:border-[#1E4ED8]" />
            <button type="submit" className="rounded-xl bg-[#1E4ED8] px-4 text-[14px] font-semibold text-white">Find</button>
          </form>
        ) : null}
        {error ? <div className="mb-2 rounded-lg bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b91c1c]">{error}</div> : null}
        {loading ? <div className="py-6 text-center text-[14px] text-[#64748b]">Loading eBooks…</div> : null}
        {books?.length === 0 ? <div className="py-4 text-center text-[14px] text-[#64748b]">No eBooks on this FAST Code yet.</div> : null}
        {books?.map((b) => (
          <button key={b.id} type="button" onClick={() => onPick(fastCode.trim().toLowerCase(), b.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f8fafc]">
            {b.coverImageUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={b.coverImageUrl} alt="" className="h-12 w-9 rounded object-cover" />
              : <span className="flex h-12 w-9 items-center justify-center rounded bg-[#eef3ff] text-[#1E4ED8]"><IconBook className="h-4 w-4" /></span>}
            <span className="truncate text-[15px] font-medium">{b.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
