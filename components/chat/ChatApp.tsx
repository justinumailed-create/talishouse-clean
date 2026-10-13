"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { isAgentOnline, istDate, presenceLabel } from "@/lib/agent-collab";
import {
  CHAT_FILES_BUCKET,
  CHAT_MAX_CHARS,
  CHAT_POLL_MS,
  CHAT_REACTIONS,
  avatarColor,
  canEditMessage,
  chatTick,
  inboxTime,
  initials,
  isImageMime,
  receiptTime,
  validateChatFile,
} from "@/lib/chat/model";
import { formatBytes, formatIstTime } from "@/lib/agent-collab";
import { supabase } from "@/lib/supabase";
import type { ChatMessageView, ChatThreadView, InboxItem, SearchHit } from "@/lib/chat/server";
import EbookSheet, { EbookPicker } from "./EbookSheet";
import {
  IconBack, IconBook, IconClose, IconFile, IconGrid, IconImage, IconMegaphone, IconMenu, IconPin, IconPlus, IconSearch, IconSend, Ticks,
} from "./icons";

export interface ChatViewer {
  memberId: string;
  name: string;
  kind: "agent" | "admin";
  chatOnLogin: boolean | null;
  dashboardHref: string;
}

async function api<T>(body: Record<string, unknown>): Promise<{ ok: boolean; value?: T; error?: string; unread?: number }> {
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return await res.json();
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}

function Avatar({ id, name, size = 44, online, updates }: { id: string; name: string; size?: number; online?: boolean; updates?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white" style={{ background: updates ? "linear-gradient(135deg,#1E4ED8,#7C3AED)" : avatarColor(id), fontSize: size * 0.36 }}>
        {updates ? <IconMegaphone className="h-[45%] w-[45%]" /> : initials(name)}
      </div>
      {online ? <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" data-online="1" /> : null}
    </div>
  );
}

function dayLabel(iso: string): string {
  const d = istDate(new Date(iso));
  const today = istDate();
  const yesterday = istDate(new Date(Date.now() - 86400000));
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ChatApp({ viewer, conversationId }: { viewer: ChatViewer; conversationId: string | null }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOnLogin, setChatOnLogin] = useState(viewer.chatOnLogin);
  const [, setTick] = useState(0);

  // iOS: size the app to the visual viewport so the composer rides above the keyboard.
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      if (rootRef.current) rootRef.current.style.height = `${vv.height}px`;
      window.scrollTo(0, 0);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => { vv.removeEventListener("resize", apply); vv.removeEventListener("scroll", apply); };
  }, []);

  const loadInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?view=inbox", { cache: "no-store" });
      if (res.status === 401) { router.replace("/agent/login"); return; }
      const data = (await res.json()) as { items?: InboxItem[] };
      if (data.items) setItems(data.items);
    } catch { /* offline: keep last list */ }
  }, [router]);

  useEffect(() => {
    void loadInbox();
    const t = setInterval(() => { if (document.visibilityState === "visible") void loadInbox(); setTick((n) => n + 1); }, CHAT_POLL_MS * 2);
    return () => clearInterval(t);
  }, [loadInbox, conversationId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setHits(null); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/chat?view=search&q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; value?: SearchHit[] };
      setHits(data.value ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function openItem(item: InboxItem) {
    if (item.conversationId) { router.push(`/chat/${item.conversationId}`); return; }
    if (!item.peerMemberId) return;
    const r = await api<string>({ op: "open", peerMemberId: item.peerMemberId });
    if (r.ok && r.value) router.push(`/chat/${r.value}`);
  }

  async function toggleChatOnLogin() {
    const next = !chatOnLogin;
    setChatOnLogin(next);
    const r = await api({ op: "prefs", chatOnLogin: next });
    if (!r.ok) setChatOnLogin(!next);
  }

  const totalUnread = (items ?? []).reduce((a, i) => a + i.unread, 0);
  const recent = (items ?? []).filter((i) => i.conversationId && (i.lastAt || i.kind === "updates"));
  const people = (items ?? []).filter((i) => !(i.conversationId && (i.lastAt || i.kind === "updates")));

  const inbox = (
    <section className={`${conversationId ? "hidden md:flex" : "flex"} h-full w-full min-w-0 flex-col border-r border-[#e5e9f0] bg-white md:w-[360px] md:shrink-0`}>
      <header className="shrink-0 border-b border-[#eef1f6] px-4 pb-3" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
        <div className="flex items-center gap-3">
          <Avatar id={viewer.memberId} name={viewer.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-bold leading-tight tracking-tight">Chats{totalUnread ? <span className="ml-2 align-middle rounded-full bg-[#1E4ED8] px-2 py-0.5 text-[11px] font-semibold text-white">{totalUnread}</span> : null}</div>
            <div className="truncate text-[12px] text-[#64748b]">{viewer.name}{viewer.kind === "admin" ? " · Admin" : ""}</div>
          </div>
          <Link href={viewer.dashboardHref} className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe3ef] px-3 py-1.5 text-[13px] font-semibold text-[#1E4ED8] hover:bg-[#f1f5ff]" data-testid="dashboard-link">
            <IconGrid className="h-4 w-4" /> Dashboard
          </Link>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="rounded-full p-2 text-[#475569] hover:bg-[#f1f5f9]" aria-label="Menu"><IconMenu /></button>
            {menuOpen ? (
              <div className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-[#e5e9f0] bg-white p-2 text-[14px] shadow-xl">
                {chatOnLogin !== null ? (
                  <button type="button" onClick={toggleChatOnLogin} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[#f8fafc]">
                    <span>Open chat on login</span>
                    <span className={`relative h-5 w-9 rounded-full transition ${chatOnLogin ? "bg-[#1E4ED8]" : "bg-[#cbd5e1]"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${chatOnLogin ? "left-[18px]" : "left-0.5"}`} /></span>
                  </button>
                ) : null}
                <Link href={viewer.dashboardHref} className="block rounded-xl px-3 py-2.5 hover:bg-[#f8fafc]">Go to dashboard</Link>
                <div className="px-3 py-2 text-[12px] leading-snug text-[#64748b]">Tip: use “Add to Home Screen” in your browser to install Chat as an app.</div>
              </div>
            ) : null}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-xl bg-[#f1f5f9] px-3 py-2 text-[#64748b]">
          <IconSearch className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchOpen(true)} placeholder="Search messages" className="w-full bg-transparent text-[15px] text-[#0f172a] outline-none placeholder:text-[#94a3b8]" />
          {query ? <button type="button" onClick={() => { setQuery(""); setSearchOpen(false); }} aria-label="Clear"><IconClose className="h-4 w-4" /></button> : null}
        </label>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {searchOpen && hits ? (
          <div>
            <div className="px-4 pb-1 pt-3 text-[12px] font-semibold uppercase tracking-wide text-[#94a3b8]">{hits.length} result{hits.length === 1 ? "" : "s"}</div>
            {hits.map((h) => (
              <button key={h.messageId} type="button" onClick={() => router.push(`/chat/${h.conversationId}?m=${h.messageId}`)} className="block w-full border-b border-[#f1f5f9] px-4 py-3 text-left hover:bg-[#f8fafc]">
                <div className="flex justify-between text-[13px]"><span className="font-semibold">{h.title}</span><span className="text-[#94a3b8]">{inboxTime(h.createdAt)}</span></div>
                <div className="mt-0.5 line-clamp-2 text-[14px] text-[#475569]"><span className="text-[#94a3b8]">{h.senderName}: </span>{h.preview}</div>
              </button>
            ))}
          </div>
        ) : items === null ? (
          <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div>
        ) : (
          <>
            {recent.map((i) => <InboxRow key={i.conversationId!} item={i} active={i.conversationId === conversationId} onOpen={() => openItem(i)} />)}
            {people.length ? <div className="px-4 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-wide text-[#94a3b8]">Start a conversation</div> : null}
            {people.map((i) => <InboxRow key={i.peerMemberId ?? i.title} item={i} active={false} onOpen={() => openItem(i)} />)}
          </>
        )}
      </div>
    </section>
  );

  return (
    <div ref={rootRef} className="flex h-[100dvh] w-full overflow-hidden" onClick={() => menuOpen && setMenuOpen(false)}>
      {inbox}
      {conversationId ? (
        <Thread key={conversationId} viewer={viewer} conversationId={conversationId} onChanged={loadInbox} />
      ) : (
        <section className="hidden flex-1 flex-col items-center justify-center gap-3 text-center text-[#64748b] md:flex">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm"><IconSend className="h-7 w-7 text-[#1E4ED8]" /></div>
          <div className="text-[18px] font-semibold text-[#0f172a]">Talispros Chat</div>
          <div className="max-w-xs! text-[14px]">Pick a conversation or post in Updates. Messages are private to their participants.</div>
        </section>
      )}
    </div>
  );
}

function InboxRow({ item, active, onOpen }: { item: InboxItem; active: boolean; onOpen: () => void }) {
  const online = item.kind === "dm" && isAgentOnline(item.presence);
  return (
    <button type="button" onClick={onOpen} data-testid="inbox-row" className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? "bg-[#eef3ff]" : "hover:bg-[#f8fafc]"}`}>
      <Avatar id={item.peerMemberId ?? "updates"} name={item.title} online={online} updates={item.kind === "updates"} />
      <div className="min-w-0 flex-1 border-b border-[#f1f5f9] pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[16px] font-semibold">{item.title}{item.peerKind === "admin" ? <span className="ml-1.5 rounded bg-[#eef3ff] px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-[#1E4ED8]">Admin</span> : null}</span>
          <span className={`shrink-0 text-[12px] ${item.unread ? "font-semibold text-[#1E4ED8]" : "text-[#94a3b8]"}`}>{inboxTime(item.lastAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-[14px] ${item.unread ? "font-medium text-[#0f172a]" : "text-[#64748b]"}`}>
            {item.previewMine ? "You: " : ""}{item.preview || (item.kind === "dm" ? (online ? "Online" : presenceLabel(item.presence)) : "")}
          </span>
          {item.unread ? <span className="min-w-[22px] shrink-0 rounded-full bg-[#1E4ED8] px-1.5 py-0.5 text-center text-[12px] font-bold text-white" data-testid="unread-badge">{item.unread}</span> : null}
        </div>
      </div>
    </button>
  );
}

function Thread({ viewer, conversationId, onChanged }: { viewer: ChatViewer; conversationId: string; onChanged: () => void }) {
  const router = useRouter();
  const [thread, setThread] = useState<ChatThreadView | null>(null);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessageView | null>(null);
  const [editing, setEditing] = useState<ChatMessageView | null>(null);
  const [selected, setSelected] = useState<ChatMessageView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [ebook, setEbook] = useState<{ fastCode: string; bookId: string; title: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const lastTyping = useRef(0);
  const lastCount = useRef(0);
  const stick = useRef(true);
  const fileUrls = useRef(new Map<string, { url: string; at: number }>());

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const visible = document.visibilityState === "visible";
      const res = await fetch(`/api/chat?view=thread&c=${conversationId}${visible ? "" : "&read=0"}`, { cache: "no-store" });
      if (res.status === 404) { setMissing(true); return; }
      if (res.status === 401) { router.replace("/agent/login"); return; }
      const data = (await res.json()) as { thread?: ChatThreadView };
      if (data.thread) {
        // Keep each attachment's signed URL stable between polls (no image flicker); refresh after 30 min.
        const now = Date.now();
        for (const m of data.thread.messages) {
          if (!m.file?.url) continue;
          const kept = fileUrls.current.get(m.id);
          if (kept && now - kept.at < 30 * 60 * 1000) m.file.url = kept.url;
          else fileUrls.current.set(m.id, { url: m.file.url, at: now });
        }
        setThread(data.thread);
      }
    } catch { /* keep last state */ } finally {
      busy.current = false;
    }
  }, [conversationId, router]);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m");
    if (m) { setHighlight(m); stick.current = false; }
    void load().then(onChanged);
    const t = setInterval(() => void load(), CHAT_POLL_MS);
    const onVis = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load, onChanged]);

  // Auto-scroll to the newest message when it arrives (unless the user scrolled up).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !thread) return;
    const n = thread.messages.length;
    if (highlight && lastCount.current === 0) {
      document.getElementById(`msg-${highlight}`)?.scrollIntoView({ block: "center" });
    } else if (stick.current || (n > lastCount.current && thread.messages[n - 1]?.mine)) {
      el.scrollTop = el.scrollHeight;
    }
    lastCount.current = n;
  }, [thread, highlight]);

  function onScroll() {
    const el = scrollRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function onType(v: string) {
    setText(v);
    const now = Date.now();
    if (v && now - lastTyping.current > 3000) {
      lastTyping.current = now;
      void api({ op: "typing", conversationId });
    }
  }

  async function send(extra: Record<string, unknown> = {}) {
    if (sending) return;
    const body = text.trim();
    if (editing) {
      if (!body && !editing.file && !editing.ebook) return;
      setSending(true);
      const r = await api({ op: "edit", messageId: editing.id, body });
      setSending(false);
      if (!r.ok) { setError(r.error ?? "Could not edit."); return; }
      setEditing(null); setText(""); void load();
      return;
    }
    if (!body && !extra.filePath && !extra.ebook) return;
    setSending(true); setError(null);
    const r = await api({ op: "send", conversationId, body, replyToId: replyTo?.id ?? null, ...extra });
    setSending(false);
    if (!r.ok) { setError(r.error ?? "Could not send."); return; }
    setText(""); setReplyTo(null); stick.current = true;
    await load(); onChanged();
    inputRef.current?.focus();
  }

  async function upload(file: File | undefined) {
    setAttachOpen(false);
    if (!file) return;
    const check = validateChatFile({ name: file.name, size: file.size });
    if (!check.ok) { setError(check.error); return; }
    setSending(true); setError(null);
    const r = await api<{ path: string; token: string; mimeType: string }>({ op: "upload", conversationId, name: file.name, size: file.size });
    if (!r.ok || !r.value) { setSending(false); setError(r.error ?? "Upload failed."); return; }
    const { error: upErr } = await supabase.storage.from(CHAT_FILES_BUCKET).uploadToSignedUrl(r.value.path, r.value.token, file, { contentType: r.value.mimeType });
    setSending(false);
    if (upErr) { setError("Upload failed."); return; }
    await send({ filePath: r.value.path });
  }

  async function act(op: string, m: ChatMessageView, extra: Record<string, unknown> = {}) {
    setSelected(null);
    const r = await api({ op, messageId: m.id, ...extra });
    if (!r.ok) setError(r.error ?? "Something went wrong.");
    void load();
  }

  const pinned = useMemo(() => (thread?.messages ?? []).filter((m) => m.pinnedAt).sort((a, b) => (b.pinnedAt ?? "").localeCompare(a.pinnedAt ?? "")), [thread]);
  const online = thread?.peer ? isAgentOnline(thread.peer.presence) : false;
  const status = !thread ? "" : thread.typing.length ? `${thread.typing.join(", ")} typing…`
    : thread.kind === "updates" ? `${thread.memberCount} members · everyone can read`
    : thread.peer ? (online ? "Online" : presenceLabel(thread.peer.presence).replace(/^Last seen/, "last seen")) : "";

  if (missing) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-[17px] font-semibold">Conversation not found</div>
        <Link href="/chat" className="rounded-full bg-[#1E4ED8] px-4 py-2 text-[14px] font-semibold text-white">Back to chats</Link>
      </section>
    );
  }

  let lastDay = "";
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-[#eef2f7]">
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-[#e5e9f0] bg-white px-2 pb-2 md:px-4" style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}>
        <Link href="/chat" className="rounded-full p-1.5 text-[#1E4ED8] md:hidden" aria-label="Back"><IconBack /></Link>
        {thread ? <Avatar id={thread.peer?.memberId ?? "updates"} name={thread.title} size={40} online={online} updates={thread.kind === "updates"} /> : <div className="h-10 w-10 rounded-full bg-[#e2e8f0]" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold leading-tight" data-testid="thread-title">{thread?.title ?? "…"}</div>
          <div className={`truncate text-[12.5px] ${thread?.typing.length || online ? "text-[#16a34a]" : "text-[#64748b]"}`} data-testid="thread-status">{status}</div>
        </div>
        {pinned.length ? (
          <button type="button" onClick={() => setPinsOpen(true)} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-[#475569] hover:bg-[#f1f5f9]"><IconPin /> {pinned.length}</button>
        ) : null}
      </header>
      {pinned[0] ? (
        <button type="button" onClick={() => document.getElementById(`msg-${pinned[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="flex shrink-0 items-center gap-2 border-b border-[#e5e9f0] bg-white/95 px-4 py-2 text-left text-[13px]">
          <IconPin className="h-4 w-4 shrink-0 text-[#1E4ED8]" />
          <span className="truncate"><span className="font-semibold">Pinned · </span>{pinned[0].body || pinned[0].ebook?.title || pinned[0].file?.name}</span>
        </button>
      ) : null}

      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-8" data-testid="messages">
        {thread === null ? <div className="pt-10 text-center text-[13px] text-[#64748b]">Loading…</div> : null}
        {thread && thread.messages.length === 0 ? (
          <div className="mx-auto mt-10 max-w-xs! rounded-2xl bg-white/80 p-4 text-center text-[13px] text-[#64748b]">
            {thread.kind === "updates" ? "Post a status update for all agents and admins." : "Say hello 👋 Messages are private to the two of you."}
          </div>
        ) : null}
        {thread?.messages.map((m, idx) => {
          const day = istDate(new Date(m.createdAt));
          const showDay = day !== lastDay;
          lastDay = day;
          const prev = thread.messages[idx - 1];
          const showName = thread.kind === "updates" && !m.mine && (!prev || prev.senderId !== m.senderId || showDay);
          return (
            <div key={m.id}>
              {showDay ? <div className="my-3 text-center"><span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-[#64748b] shadow-sm">{dayLabel(m.createdAt)}</span></div> : null}
              <Bubble m={m} showName={showName} updates={thread.kind === "updates"} highlight={highlight === m.id} onTap={() => setSelected(m)} onReact={(e) => act("react", m, { emoji: e })} onOpenEbook={(e) => setEbook(e)} />
            </div>
          );
        })}
      </div>

      <footer className="shrink-0 border-t border-[#e5e9f0] bg-white px-2 pt-2 md:px-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }} data-testid="composer">
        {error ? <div className="mb-2 flex items-center justify-between rounded-lg bg-[#fef2f2] px-3 py-1.5 text-[13px] text-[#b91c1c]"><span>{error}</span><button type="button" onClick={() => setError(null)}><IconClose className="h-4 w-4" /></button></div> : null}
        {replyTo || editing ? (
          <div className="mb-2 flex items-center gap-2 rounded-xl border-l-4 border-[#1E4ED8] bg-[#f1f5ff] px-3 py-1.5 text-[13px]">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#1E4ED8]">{editing ? "Editing message" : `Replying to ${replyTo!.mine ? "yourself" : replyTo!.senderName}`}</div>
              <div className="truncate text-[#475569]">{(editing ?? replyTo)!.body || (editing ?? replyTo)!.ebook?.title || (editing ?? replyTo)!.file?.name}</div>
            </div>
            <button type="button" onClick={() => { setReplyTo(null); if (editing) { setEditing(null); setText(""); } }} aria-label="Cancel"><IconClose className="h-4 w-4 text-[#64748b]" /></button>
          </div>
        ) : null}
        <div className="relative flex items-end gap-2">
          <button type="button" onClick={() => setAttachOpen((v) => !v)} disabled={Boolean(editing)} className="mb-0.5 rounded-full p-2 text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40" aria-label="Attach"><IconPlus /></button>
          {attachOpen ? (
            <div className="absolute bottom-14 left-0 z-20 w-56 rounded-2xl border border-[#e5e9f0] bg-white p-1.5 text-[14px] shadow-xl">
              <button type="button" onClick={() => photoRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f8fafc]"><IconImage className="h-5 w-5 text-[#9333EA]" /> Photo</button>
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f8fafc]"><IconFile className="h-5 w-5 text-[#1E4ED8]" /> Document</button>
              <button type="button" onClick={() => { setAttachOpen(false); setPickerOpen(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f8fafc]"><IconBook className="h-5 w-5 text-[#0E9F6E]" /> Share eBook</button>
            </div>
          ) : null}
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); void send(); } }}
            rows={1}
            maxLength={CHAT_MAX_CHARS}
            placeholder={thread?.kind === "updates" ? "Post an update…" : "Message"}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[22px] border border-[#dbe3ef] bg-[#f8fafc] px-4 py-2.5 text-[16px] leading-[1.35] outline-none focus:border-[#1E4ED8] focus:bg-white"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button type="button" onClick={() => void send()} disabled={sending || !text.trim()} className="mb-0.5 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#1E4ED8] text-white shadow-sm transition disabled:bg-[#cbd5e1]" aria-label="Send"><IconSend /></button>
        </div>
      </footer>

      {selected ? (
        <Sheet onClose={() => setSelected(null)}>
          <div className="flex justify-around px-2 pb-3">
            {CHAT_REACTIONS.map((e) => (
              <button key={e} type="button" onClick={() => act("react", selected, { emoji: e })} className={`rounded-full p-2 text-[26px] ${selected.reactions.find((r) => r.emoji === e)?.mine ? "bg-[#eef3ff]" : ""}`}>{e}</button>
            ))}
          </div>
          {selected.mine && thread?.kind === "dm" ? (
            <div className="mx-3 mb-2 rounded-xl bg-[#f8fafc] p-3 text-[13px]" data-testid="receipts">
              <Receipt label="Sent" at={selected.createdAt} tick="sent" />
              <Receipt label="Delivered" at={selected.deliveredAt} tick="delivered" />
              <Receipt label="Read" at={selected.readAt} tick="read" />
            </div>
          ) : (
            <div className="mx-3 mb-2 rounded-xl bg-[#f8fafc] p-3 text-[13px] text-[#475569]">{selected.mine ? "You" : selected.senderName} · {receiptTime(selected.createdAt)}{selected.editedAt ? ` · edited ${formatIstTime(selected.editedAt)}` : ""}</div>
          )}
          <SheetButton onClick={() => { setReplyTo(selected); setEditing(null); setSelected(null); inputRef.current?.focus(); }}>Reply</SheetButton>
          {selected.body ? <SheetButton onClick={() => { void navigator.clipboard?.writeText(selected.body); setSelected(null); }}>Copy text</SheetButton> : null}
          {(thread?.kind === "dm" || viewer.kind === "admin" || selected.mine) ? (
            <SheetButton onClick={() => act("pin", selected, { pinned: !selected.pinnedAt })}>{selected.pinnedAt ? "Unpin" : "Pin message"}</SheetButton>
          ) : null}
          {canEditMessage(selected) ? <SheetButton onClick={() => { setEditing(selected); setReplyTo(null); setText(selected.body); setSelected(null); inputRef.current?.focus(); }}>Edit</SheetButton> : null}
          {selected.mine && !selected.deletedAt ? <SheetButton danger onClick={() => { if (window.confirm("Delete this message for everyone?")) void act("delete", selected); }}>Delete for everyone</SheetButton> : null}
        </Sheet>
      ) : null}

      {pinsOpen ? (
        <Sheet onClose={() => setPinsOpen(false)} title="Pinned messages">
          {pinned.map((m) => (
            <button key={m.id} type="button" onClick={() => { setPinsOpen(false); document.getElementById(`msg-${m.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="block w-full border-b border-[#f1f5f9] px-4 py-3 text-left">
              <div className="text-[12px] text-[#64748b]">{m.mine ? "You" : m.senderName} · {receiptTime(m.createdAt)}</div>
              <div className="line-clamp-2 text-[14px]">{m.body || m.ebook?.title || m.file?.name}</div>
            </button>
          ))}
        </Sheet>
      ) : null}

      {pickerOpen ? <EbookPicker onClose={() => setPickerOpen(false)} onPick={(fastCode, bookId) => { setPickerOpen(false); void send({ ebook: { fastCode, bookId } }); }} /> : null}
      {ebook ? <EbookSheet {...ebook} backHref={`/chat/${conversationId}`} onClose={() => setEbook(null)} /> : null}
    </section>
  );
}

function Receipt({ label, at, tick }: { label: string; at: string | null; tick: "sent" | "delivered" | "read" }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2 font-medium"><Ticks tick={tick} /> {label}</span>
      <span className={at ? "text-[#0f172a]" : "text-[#94a3b8]"}>{receiptTime(at)}</span>
    </div>
  );
}

function Bubble({ m, showName, updates, highlight, onTap, onReact, onOpenEbook }: {
  m: ChatMessageView; showName: boolean; updates: boolean; highlight: boolean;
  onTap: () => void; onReact: (e: string) => void; onOpenEbook: (e: { fastCode: string; bookId: string; title: string }) => void;
}) {
  const tick = chatTick(m);
  const image = m.file && isImageMime(m.file.mime);
  return (
    <div id={`msg-${m.id}`} className={`mb-1.5 flex ${m.mine ? "justify-end" : "justify-start"}`} data-testid="message">
      <div className={highlight ? "rounded-2xl ring-2 ring-[#F59E0B] ring-offset-2" : ""} style={{ maxWidth: "min(82%, 560px)" /* inline: globals.css has an unlayered * { max-width: 100% } on mobile */ }}>
        <div
          role="button"
          tabIndex={0}
          onClick={onTap}
          onKeyDown={(e) => { if (e.key === "Enter") onTap(); }}
          className={`relative cursor-pointer select-none rounded-2xl px-3 py-2 text-[15px] leading-[1.4] shadow-[0_1px_1px_rgba(15,23,42,0.06)] ${
            m.mine ? "rounded-br-md bg-[#DCE8FF] text-[#0f172a]" : "rounded-bl-md bg-white text-[#0f172a]"
          } ${m.deletedAt ? "italic text-[#94a3b8]" : ""}`}
        >
          {showName ? <div className="mb-0.5 text-[12.5px] font-semibold" style={{ color: avatarColor(m.senderId) }}>{m.senderName}</div> : null}
          {m.pinnedAt ? <div className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#64748b]"><IconPin className="h-3 w-3" /> Pinned</div> : null}
          {m.replyTo ? (
            <div className="mb-1.5 rounded-lg border-l-[3px] border-[#1E4ED8] bg-black/[0.04] px-2 py-1 text-[13px]">
              <div className="font-semibold text-[#1E4ED8]">{m.replyTo.senderName}</div>
              <div className="line-clamp-2 text-[#475569]">{m.replyTo.preview}</div>
            </div>
          ) : null}
          {image && m.file?.url ? (
            <a href={m.file.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mb-1 block overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.file.url} alt={m.file.name} className="max-h-72 w-full object-cover" />
            </a>
          ) : m.file ? (
            <a href={m.file.url ?? "#"} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mb-1 flex items-center gap-3 rounded-xl bg-black/[0.04] p-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E4ED8] text-white"><IconFile /></span>
              <span className="min-w-0"><span className="block truncate text-[14px] font-semibold">{m.file.name}</span><span className="block text-[12px] text-[#64748b]">{formatBytes(m.file.size)}</span></span>
            </a>
          ) : null}
          {m.ebook ? (
            <div className="mb-1 overflow-hidden rounded-xl border border-[#d6e0f0] bg-white" data-testid="ebook-card">
              <div className="flex items-center gap-3 p-2.5">
                <span className="flex h-12 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#0E9F6E] to-[#1E4ED8] text-white"><IconBook /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{m.ebook.title}</span>
                  <span className="block text-[12px] uppercase text-[#64748b]">eBook · {m.ebook.fastCode}</span>
                </span>
              </div>
              {m.ebook.canEdit ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenEbook(m.ebook!); }} className="w-full border-t border-[#e5e9f0] py-2 text-[14px] font-semibold text-[#1E4ED8] hover:bg-[#f8fafc]">Open editor</button>
              ) : (
                <div className="border-t border-[#e5e9f0] py-2 text-center text-[12px] text-[#94a3b8]">You don’t have edit access</div>
              )}
            </div>
          ) : null}
          {m.deletedAt ? <span>This message was deleted</span> : m.body ? <span className="whitespace-pre-wrap break-words">{m.body}</span> : null}
          <span className="float-right ml-2 mt-1.5 flex translate-y-0.5 items-center gap-1 text-[11px] text-[#64748b]">
            {m.editedAt && !m.deletedAt ? <span>edited</span> : null}
            {formatIstTime(m.createdAt).replace(/ IST$/, "")}
            {m.mine && !updates && !m.deletedAt ? <Ticks tick={tick} /> : null}
          </span>
        </div>
        {m.reactions.length ? (
          <div className={`-mt-1 flex gap-1 ${m.mine ? "justify-end pr-2" : "pl-2"}`}>
            {m.reactions.map((r) => (
              <button key={r.emoji} type="button" onClick={() => onReact(r.emoji)} className={`rounded-full border px-1.5 py-0.5 text-[13px] shadow-sm ${r.mine ? "border-[#1E4ED8] bg-[#eef3ff]" : "border-[#e5e9f0] bg-white"}`}>
                {r.emoji}{r.count > 1 ? <span className="ml-0.5 text-[11px] text-[#475569]">{r.count}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white pt-2 shadow-2xl md:max-w-md! md:rounded-3xl" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-[#e2e8f0] md:hidden" />
        {title ? <div className="px-4 pb-2 text-[16px] font-semibold">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

function SheetButton({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`block w-full px-5 py-3.5 text-left text-[16px] hover:bg-[#f8fafc] ${danger ? "text-[#dc2626]" : "text-[#0f172a]"}`}>{children}</button>;
}
