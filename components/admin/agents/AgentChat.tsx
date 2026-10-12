"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_CHAT_MAX_CHARS,
  formatIst,
  formatIstTime,
  isAgentOnline,
  messageTick,
  presenceLabel,
  type MessageTick,
} from "@/lib/agent-collab";
import { PresenceDot, cardClass, primaryButton } from "./ui";

type Presence = { agentId: string; lastSeenAt: string | null; signedOutAt: string | null } | null;
type Contact = { agentId: string; name: string; loginId: string; presence: Presence; conversationId: string | null; lastMessageAt: string | null; unread: number };
type Message = { id: string; mine: boolean; body: string; createdAt: string };
type Thread = { conversationId: string | null; messages: Message[]; peerDeliveredAt: string | null; peerReadAt: string | null; peer: { agentId: string; name: string; presence: Presence } };

const POLL_MS = 4000;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
}

function Ticks({ tick, deliveredAt, readAt, sentAt }: { tick: MessageTick; deliveredAt: string | null; readAt: string | null; sentAt: string }) {
  const title =
    tick === "read" ? `Read ${formatIst(readAt)}` : tick === "delivered" ? `Delivered ${formatIst(deliveredAt)}` : `Sent ${formatIst(sentAt)}`;
  const color = tick === "read" ? "text-sky-300" : "text-white/70";
  return (
    <span title={title} aria-label={title} className={`inline-flex ${color}`}>
      <svg viewBox="0 0 18 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 6.5 4.5 10 11 2" />
        {tick !== "sent" ? <path d="M7 10 7.6 10.5 15.5 2" /> : null}
      </svg>
    </span>
  );
}

function Avatar({ name, online }: { name: string; online: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E4ED8]/10 text-xs font-semibold text-[#1E4ED8]">{initials(name)}</span>
      <PresenceDot online={online} className="absolute -bottom-0.5 -right-0.5" />
    </span>
  );
}

export default function AgentChat({ initialPeer }: { initialPeer: string | null }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [peer, setPeer] = useState<string | null>(initialPeer);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const bottom = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const loadContacts = useCallback(async () => {
    const res = await fetch("/api/agent/chat", { cache: "no-store" });
    if (res.ok) setContacts(((await res.json()) as { contacts: Contact[] }).contacts);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const visible = typeof document === "undefined" || document.visibilityState === "visible";
    const res = await fetch(`/api/agent/chat?with=${encodeURIComponent(id)}${visible ? "" : "&read=0"}`, { cache: "no-store" });
    if (res.ok) setThread(((await res.json()) as { thread: Thread }).thread);
    else if (res.status === 404) setError("That agent is not available.");
  }, []);

  useEffect(() => {
    let alive = true;
    let inFlight = false;
    const tick = async () => {
      if (!alive || inFlight) return;
      inFlight = true;
      try {
        await Promise.all([loadContacts(), peer ? loadThread(peer) : Promise.resolve()]);
      } catch {
        /* offline: keep last state, retry on next poll */
      } finally {
        inFlight = false;
      }
      if (alive) setNow(Date.now());
    };
    void tick();
    const timer = window.setInterval(tick, POLL_MS);
    return () => { alive = false; window.clearInterval(timer); };
  }, [peer, loadContacts, loadThread]);

  useEffect(() => {
    const count = thread?.messages.length ?? 0;
    if (count !== lastCount.current) bottom.current?.scrollIntoView({ block: "end" });
    lastCount.current = count;
  }, [thread]);

  async function send() {
    const body = draft.trim();
    if (!peer || !body) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: peer, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send.");
      setDraft("");
      await loadThread(peer);
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  const activePeer = thread && thread.peer.agentId === peer ? thread.peer : null;
  const totalUnread = (contacts ?? []).reduce((n, c) => n + c.unread, 0);

  return (
    <div className={`${cardClass} grid min-h-[560px] overflow-hidden md:grid-cols-[280px_1fr]`}>
      <aside className={`border-b border-neutral-200 md:border-b-0 md:border-r ${peer ? "hidden md:block" : ""}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">Agents</h2>
          {totalUnread > 0 ? <span className="rounded-full bg-[#1E4ED8] px-2 py-0.5 text-xs font-semibold text-white">{totalUnread}</span> : null}
        </div>
        {contacts === null ? (
          <p className="px-4 py-3 text-sm text-neutral-500">Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="px-4 py-3 text-sm text-neutral-500">No other agents yet.</p>
        ) : (
          <ul>
            {contacts.map((c) => {
              const online = isAgentOnline(c.presence, now);
              return (
                <li key={c.agentId}>
                  <button
                    type="button"
                    onClick={() => { setPeer(c.agentId); setThread(null); setError(null); }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 ${peer === c.agentId ? "bg-[#1E4ED8]/5" : ""}`}
                  >
                    <Avatar name={c.name} online={online} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-900">{c.name}</span>
                      <span className={`block truncate text-xs ${online ? "text-green-700" : "text-neutral-500"}`}>
                        {presenceLabel(c.presence, new Date(now))}
                      </span>
                    </span>
                    {c.unread > 0 ? (
                      <span aria-label={`${c.unread} unread`} className="rounded-full bg-[#1E4ED8] px-2 py-0.5 text-xs font-semibold text-white">{c.unread}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className={`flex min-h-[560px] flex-col ${peer ? "" : "hidden md:flex"}`}>
        {!peer ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">Choose an agent to start a conversation.</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
              <button type="button" className="text-sm text-neutral-500 md:hidden" onClick={() => setPeer(null)} aria-label="Back to agents">←</button>
              {activePeer ? (
                <>
                  <Avatar name={activePeer.name} online={isAgentOnline(activePeer.presence, now)} />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{activePeer.name}</p>
                    <p className={`text-xs ${isAgentOnline(activePeer.presence, now) ? "text-green-700" : "text-neutral-500"}`}>
                      {presenceLabel(activePeer.presence, new Date(now))}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500">Loading…</p>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 px-4 py-4" style={{ maxHeight: 460 }}>
              {thread && thread.messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-500">No messages yet. Say hello.</p>
              ) : null}
              {thread?.messages.map((m) => {
                const tick = m.mine ? messageTick(m.createdAt, thread.peerDeliveredAt, thread.peerReadAt) : null;
                return (
                  <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.mine ? "rounded-br-md bg-[#1E4ED8] text-white" : "rounded-bl-md bg-white text-neutral-900"}`}>
                      <div className={`whitespace-pre-wrap break-words ${m.mine ? "text-white" : "text-neutral-900"}`}>{m.body}</div>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${m.mine ? "text-white/70" : "text-neutral-400"}`}>
                        <span title={formatIst(m.createdAt)}>{formatIstTime(m.createdAt)}</span>
                        {tick ? <Ticks tick={tick} deliveredAt={thread.peerDeliveredAt} readAt={thread.peerReadAt} sentAt={m.createdAt} /> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>
            {(() => {
              const lastMine = [...(thread?.messages ?? [])].reverse().find((m) => m.mine);
              if (!lastMine || !thread) return null;
              const t = messageTick(lastMine.createdAt, thread.peerDeliveredAt, thread.peerReadAt);
              return (
                <p className="border-t border-neutral-100 px-4 py-1.5 text-right text-[11px] text-neutral-500">
                  Last message: sent {formatIstTime(lastMine.createdAt)}
                  {t !== "sent" ? ` · delivered ${formatIstTime(thread.peerDeliveredAt)}` : ""}
                  {t === "read" ? ` · read ${formatIstTime(thread.peerReadAt)}` : ""}
                </p>
              );
            })()}
            <form
              className="flex items-end gap-2 border-t border-neutral-200 p-3"
              onSubmit={(e) => { e.preventDefault(); void send(); }}
            >
              <textarea
                aria-label="Message"
                rows={1}
                maxLength={AGENT_CHAT_MAX_CHARS}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Write a message…"
                className="block max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-[#1E4ED8] focus:outline-none focus:ring-4 focus:ring-[#1E4ED8]/15"
              />
              <button type="submit" className={primaryButton} disabled={sending || !draft.trim()}>Send</button>
            </form>
            {error ? <p role="alert" className="px-4 pb-3 text-sm text-red-600">{error}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
