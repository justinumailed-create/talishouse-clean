"use client";

import { useEffect, useRef, useState } from "react";
import {
  TALISU_AUDIO,
  TALISU_AUDIO_LIBRARY,
  type TalisUAudioLibraryItem,
} from "@/lib/talisu/content";
import { TALISU_CARD } from "@/lib/talisu/ui";
import TranscriptLines from "@/components/talisu/TranscriptLines";
import {
  TALISU_AUDIO_TRANSCRIPTS,
  transcriptTitleForAudioId,
} from "@/lib/talisu/transcript";

function AudioCard({
  item,
  activeId,
  onSelect,
}: {
  item: TalisUAudioLibraryItem;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const isActive = activeId === item.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`${TALISU_CARD} flex w-full flex-col gap-2 text-left transition hover:ring-[#046BD9]/30 hover:shadow-[0_12px_28px_rgba(4,107,217,0.12)] ${
        isActive ? "ring-2 ring-[#046BD9]/40" : ""
      }`}
    >
      <span className="inline-flex w-fit rounded-full bg-[#046BD9]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#046BD9]">
        {item.kind}
      </span>
      <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
      <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>
      <span className="mt-auto pt-2 text-sm font-medium text-[#046BD9]">
        {isActive ? "Playing…" : "Play →"}
      </span>
    </button>
  );
}

/**
 * TalisU™ Audio library: autoplays the ~1 min Aisha clip on open,
 * lists other clips like KB Audios, and shows the matching
 * Aisha-labeled transcript under the player (swaps on card select).
 */
export default function TalisUAudioLibrary() {
  const autoplayItem =
    TALISU_AUDIO_LIBRARY.find((item) => item.autoplay) ?? TALISU_AUDIO_LIBRARY[0];
  const [activeId, setActiveId] = useState<string | null>(
    autoplayItem?.id ?? null,
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  /** True after the user picks a card — always attempt play on those selects. */
  const userPickedRef = useRef(false);

  const active =
    TALISU_AUDIO_LIBRARY.find((item) => item.id === activeId) ?? autoplayItem;

  const transcriptLines =
    (active?.id && TALISU_AUDIO_TRANSCRIPTS[active.id]) || null;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !active) return;
    el.load();
    // Autoplay the default clip on open; always play after a card click.
    const shouldPlay = Boolean(active.autoplay) || userPickedRef.current;
    if (!shouldPlay) return;
    const play = el.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* Browsers may block autoplay until a gesture; controls remain. */
      });
    }
  }, [active?.id, active?.autoplay]);

  function handleSelect(id: string) {
    userPickedRef.current = true;
    setActiveId(id);
  }

  return (
    <div className="space-y-8">
      <div className={TALISU_CARD}>
        <h2 className="text-center text-lg font-semibold text-neutral-950 sm:text-xl">
          {active?.title ?? TALISU_AUDIO.autoplayTitle}
        </h2>
        <p className="mt-1 text-center text-sm text-neutral-600">
          {active?.id === autoplayItem?.id
            ? TALISU_AUDIO.autoplaySubtitle
            : active?.description}
        </p>
        <audio
          ref={audioRef}
          className="mt-6 w-full"
          controls
          preload="metadata"
          src={active?.src}
          autoPlay={Boolean(active?.autoplay)}
        >
          {active?.captionsSrc ? (
            <track
              kind="captions"
              src={active.captionsSrc}
              srcLang="en"
              label="English"
            />
          ) : null}
          Your browser does not support the audio element.
        </audio>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Audios
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TALISU_AUDIO_LIBRARY.map((item) => (
            <AudioCard
              key={item.id}
              item={item}
              activeId={activeId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {transcriptLines ? (
        <article className={`mt-2 ${TALISU_CARD} px-5 py-8 sm:px-8`}>
          <h2 className="mb-6 text-center text-xl font-semibold text-neutral-950">
            {transcriptTitleForAudioId(active?.id)}
          </h2>
          <TranscriptLines lines={transcriptLines} />
        </article>
      ) : null}
    </div>
  );
}
