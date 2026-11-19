"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useT } from "@/lib/i18n/client";
import AgentTranscriptLine from "@/components/talispros/AgentTranscriptLine";
import { markPitchDone } from "@/lib/talispros/pitch-gate";
import { type SpokenLine } from "@/lib/talispros/spoken-transcript";

type AgentChunk = { chars: string[]; shown: number };
type Segment =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; chunks: AgentChunk[] };

type GuideConversationPanelProps = {
  agentId: string;
  title: string;
  autoStart: boolean;
  dynamicVariables?: string;
  recordsPitch?: boolean;
};

function parseVariables(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        out[key] = String(value);
      }
    }
    return out;
  } catch {
    return undefined;
  }
}

function Panel({ agentId, title, autoStart, dynamicVariables, recordsPitch = false }: GuideConversationPanelProps) {
  const { home } = useT();
  const copy = home.conversation;
  const [lines, setLines] = useState<SpokenLine[]>([]);
  const [draft, setDraft] = useState("");
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const segments = useRef<Segment[]>([]);
  const timers = useRef<number[]>([]);
  const chainEnd = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const boot = useRef(false);
  const connectedOnce = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const publish = () => {
    const next: SpokenLine[] = [];
    for (const segment of segments.current) {
      if (segment.role === "user") {
        next.push({ id: segment.id, role: "user", text: segment.text });
        continue;
      }
      const text = segment.chunks.map((chunk) => chunk.chars.slice(0, chunk.shown).join("")).join("");
      if (text) next.push({ id: segment.id, role: "agent", text });
    }
    setLines(next);
  };

  const revealAlignment = (
    alignment: { chars?: string[]; char_start_times_ms?: number[]; char_durations_ms?: number[] } | undefined,
  ) => {
    const chars = alignment?.chars ?? [];
    if (!chars.length) return;
    let segment = segments.current[segments.current.length - 1];
    if (!segment || segment.role !== "agent") {
      segment = { id: `agent-${segments.current.length}`, role: "agent", chunks: [] };
      segments.current.push(segment);
      chainEnd.current = 0;
    }
    const chunk: AgentChunk = { chars, shown: 0 };
    segment.chunks.push(chunk);
    const starts = alignment?.char_start_times_ms ?? [];
    const durations = alignment?.char_durations_ms ?? [];
    const last = chars.length - 1;
    const span = (starts[last] ?? 0) + (durations[last] ?? 70);
    const now = performance.now();
    const startAt = Math.max(now, chainEnd.current || now);
    chainEnd.current = startAt + Math.max(span, chars.length * 40);
    chars.forEach((_, index) => {
      const delay = Math.max(0, startAt - now + (starts[index] ?? 0));
      const timer = window.setTimeout(() => {
        chunk.shown = Math.max(chunk.shown, index + 1);
        publish();
      }, delay);
      timers.current.push(timer);
    });
  };

  const warmMic = useRef<MediaStream | null>(null);
  const warmMicTimer = useRef<number | null>(null);
  const releaseWarmMic = () => {
    if (warmMicTimer.current) window.clearTimeout(warmMicTimer.current);
    warmMicTimer.current = null;
    warmMic.current?.getTracks().forEach((track) => track.stop());
    warmMic.current = null;
  };

  const conversation = useConversation({
    onConnect: () => {
      window.setTimeout(releaseWarmMic, 1500);
      connectedOnce.current = true;
      setFailed(false);
      setEnded(false);
    },
    onDisconnect: () => {
      clearTimers();
      if (recordsPitch && connectedOnce.current) markPitchDone(window.localStorage);
      setEnded(true);
    },
    onError: () => {
      releaseWarmMic();
      setFailed(true);
    },
    onMessage: (payload) => {
      if (payload.role !== "user") return;
      const text = payload.message.replace(/\s+/g, " ").trim();
      if (!text) return;
      const last = segments.current[segments.current.length - 1];
      if (last?.role === "user" && last.text === text) return;
      segments.current.push({ id: `user-${segments.current.length}`, role: "user", text });
      chainEnd.current = 0;
      publish();
    },
    onInterruption: () => {
      clearTimers();
      chainEnd.current = 0;
    },
    onAudioAlignment: (alignment) => {
      revealAlignment(alignment);
    },
    onAudioAlignmentPlayback: ({ alignment }) => {
      revealAlignment(alignment);
    },
  });

  useEffect(
    () => () => {
      clearTimers();
      releaseWarmMic();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  /**
   * Ask for the microphone before the call starts, with echo cancelling, noise
   * suppression and automatic gain on, and hand that exact mic to the call.
   * Before this the call could open with no usable mic and the agent heard
   * silence. A blocked mic now shows a clear message instead.
   */
  const openMicrophone = async (): Promise<string | null | false> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const deviceId = stream.getAudioTracks()[0]?.getSettings().deviceId ?? null;
      // Keep this mic open until the call is connected. Closing it and letting
      // the call reopen it made headsets switch modes twice, which delayed the
      // agent's greeting by several seconds.
      releaseWarmMic();
      warmMic.current = stream;
      warmMicTimer.current = window.setTimeout(releaseWarmMic, 15000);
      return deviceId;
    } catch {
      return false;
    }
  };

  const begin = async () => {
    setFailed(false);
    setMicBlocked(false);
    setEnded(false);
    setRating(null);
    const deviceId = await openMicrophone();
    if (deviceId === false) {
      setMicBlocked(true);
      return;
    }
    const variables = parseVariables(dynamicVariables);
    conversation.startSession({
      agentId,
      connectionType: "webrtc",
      ...(deviceId ? { inputDeviceId: deviceId } : {}),
      ...(variables ? { dynamicVariables: variables } : {}),
    });
  };

  useEffect(() => {
    if (!autoStart || boot.current) return;
    boot.current = true;
    begin();
    // The call should open with the page. begin reads the latest session hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const connected = conversation.status === "connected";
  const connecting = conversation.status === "connecting";

  // Keep the mic open for the whole call and show its live level, so the
  // caller can see the agent is receiving their voice.
  useEffect(() => {
    if (!connected) {
      setMicLevel(0);
      return;
    }
    if (conversation.isMuted) conversation.setMuted(false);
    const timer = window.setInterval(() => {
      setMicLevel(Math.min(1, conversation.getInputVolume() * 3));
    }, 120);
    return () => window.clearInterval(timer);
    // conversation is stable for this provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);
  const status = connecting
    ? copy.connecting
    : connected && conversation.mode === "speaking"
      ? copy.speaking
      : connected
        ? copy.listening
        : ended
          ? copy.ended
          : "";

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    conversation.sendUserMessage(text);
    segments.current.push({ id: `user-${segments.current.length}`, role: "user", text });
    chainEnd.current = 0;
    publish();
    setDraft("");
  };

  const rate = (score: number) => {
    setRating(score);
    if (conversation.canSendFeedback) conversation.sendFeedback(score >= 4);
  };

  return (
    <div className="flex h-full min-h-[70dvh] flex-col items-center justify-start overflow-y-auto px-4 py-6 lg:min-h-[calc(100dvh-4.25rem)] lg:justify-center lg:py-10">
      <h1 className="m-0 max-w-[560px] text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-neutral-950 sm:text-[34px]">
        {title}
      </h1>
      <button
        type="button"
        data-testid="guide-call"
        onClick={() => (connected ? conversation.endSession() : begin())}
        disabled={connecting}
        className={`mt-6 inline-flex min-h-14 min-w-[220px] items-center justify-center rounded-full px-8 text-[19px] lg:text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(4,107,217,0.28)] transition disabled:opacity-70 ${
          connected ? "bg-neutral-950 hover:bg-neutral-800" : "bg-[#046BD9] hover:bg-[#0358b3]"
        }`}
      >
        {connected ? copy.endCall : copy.startCall}
      </button>
      <p
        data-testid="guide-status"
        className="mt-2 min-h-5 text-center text-[16px] lg:text-[14px] font-medium text-[#1a1a1a]"
      >
        {status}
      </p>
      {connected ? (
        <div
          data-testid="guide-mic-level"
          aria-label={copy.micLevel}
          title={copy.micLevel}
          className="mt-1 flex h-3 items-end gap-[3px]"
        >
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((step) => (
            <span
              key={step}
              className={`w-[4px] rounded-full transition-[height,background-color] duration-100 ${
                micLevel >= step ? "bg-[#046BD9]" : "bg-neutral-300"
              }`}
              style={{ height: `${4 + step * 8}px` }}
            />
          ))}
        </div>
      ) : null}
      {micBlocked ? (
        <p data-testid="guide-mic-blocked" className="mt-1 max-w-[560px] text-center text-[16px] lg:text-[13px] text-neutral-600">
          {copy.micBlocked}
        </p>
      ) : null}
      {failed && !connected ? (
        <p className="mt-1 max-w-[560px] text-center text-[16px] lg:text-[13px] text-neutral-600">{copy.callFailed}</p>
      ) : null}
      <div
        ref={transcriptRef}
        data-testid="guide-transcript"
        className="guide-transcript mt-5 w-full max-w-[560px] min-h-40 max-h-[40vh] overflow-y-auto rounded-2xl bg-white px-4 py-3 text-left text-[#1a1a1a] shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
      >
        {lines.length === 0 ? (
          <p className="m-0 text-[16px] lg:text-[14px] text-[#3f3f46]">{copy.transcriptEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line) => (
              <p
                key={line.id}
                className={`m-0 max-w-[90%] rounded-2xl px-3 py-2 text-[17px] lg:text-[15px] leading-snug ${
                  line.role === "user"
                    ? "guide-user self-end bg-[#083E86] text-white"
                    : "guide-agent self-start bg-[#f4f4f5] text-[#1a1a1a]"
                }`}
              >
                {line.role === "agent" ? <AgentTranscriptLine text={line.text} /> : line.text}
              </p>
            ))}
          </div>
        )}
      </div>
      <form
        onSubmit={send}
        className="mt-3 flex w-full max-w-[560px] items-center gap-2"
      >
        <input
          data-testid="guide-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!connected}
          placeholder={copy.placeholder}
          className="min-h-12 min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-[17px] lg:text-[15px] text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-[#046BD9] disabled:bg-neutral-100"
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-4 text-[16px] lg:text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {copy.send}
        </button>
      </form>
      {ended ? (
        <div data-testid="guide-feedback" className="mt-4 text-center">
          {rating == null ? (
            <>
              <p className="m-0 text-[16px] lg:text-[13px] text-neutral-600">{copy.feedback}</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    aria-label={`${score}`}
                    onClick={() => rate(score)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[18px] text-[#046BD9] hover:bg-[#046BD9]/10"
                  >
                    ★
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="m-0 text-[16px] lg:text-[13px] font-medium text-neutral-700">{copy.feedbackThanks}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Custom conversation for the photo-and-conversation pages. */
export default function GuideConversationPanel(props: GuideConversationPanelProps) {
  return (
    <ConversationProvider>
      <Panel {...props} />
    </ConversationProvider>
  );
}
