"use client";

import Script from "next/script";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import { aishaInvitationParts } from "@/lib/talispros/aisha-invitation";
import { aishaSpeechBubblePath } from "@/lib/talispros/aisha-speech-bubble";
import { watchPoweredByBanner } from "@/lib/talispros/hide-elevenlabs-banner";
import {
  DEFAULT_ASSISTANT_PERSONA,
  type AssistantPersona,
} from "@/lib/talispros/assistant-personas";

/**
 * Same rules as globals.css, shipped beside the widget so a cached
 * stylesheet cannot leave the write-up as a solid white pill.
 */
const BUBBLE_STYLE = `
.aisha-convai-label {
  position: relative;
  z-index: 2;
  margin: 0 0 10px;
  max-width: min(18.5rem, calc(100vw - 2rem));
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 14px 16px 26px;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.011em;
  text-align: left;
  text-wrap: balance;
  color: #1d1d1f;
  pointer-events: auto;
  cursor: pointer;
}
.aisha-bubble-shape {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.18));
}
.aisha-bubble-glass {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  backdrop-filter: saturate(180%) blur(28px);
}
.aisha-bubble-stroke {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.aisha-convai-copy { position: relative; z-index: 1; }
.aisha-convai-lead { font-weight: 500; }
.aisha-convai-rest { font-weight: 400; }
`;

function usePageOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

function usePortalHost(): HTMLElement | null {
  return useSyncExternalStore(
    () => () => {},
    () => document.body,
    () => null,
  );
}

/** The pop-up and the launcher both start the call. The terms sheet may still appear. */
function startAishaConversation(event: MouseEvent<HTMLButtonElement>) {
  const slot = event.currentTarget.closest("[data-testid='aisha-convai']");
  const widget = slot?.querySelector("elevenlabs-convai");
  const root = widget && "shadowRoot" in widget ? widget.shadowRoot : null;
  if (!root) return;
  const wanted = (event.currentTarget.dataset.startLabel ?? "").trim().toLowerCase();
  const buttons = [...root.querySelectorAll("button")];
  const match = buttons.find(
    (button) => button.textContent?.trim().toLowerCase() === wanted,
  );
  (match ?? buttons[0])?.click();
}

/**
 * Public voice and chat widget. The embed script loads after the page is
 * interactive. The spoken first message is set in ElevenLabs, not here.
 */
export default function AishaConvaiWidget({
  persona = DEFAULT_ASSISTANT_PERSONA,
  invitation = "greeting",
  placement = "bottom-left",
  agentId: agentIdOverride,
  dynamicVariables,
}: {
  persona?: AssistantPersona;
  /** Homepage greeting, or the call-back line used on an allowlisted Mapsite. */
  invitation?: "greeting" | "callback";
  placement?: "bottom-left" | "bottom-right";
  /** Mapsite pages pass their own agent. Other pages keep the homepage agent. */
  agentId?: string;
  /** JSON for the Mapsite agent. Omitted on the homepage. */
  dynamicVariables?: string;
}) {
  const copy = useT().home.assistants[persona.id];
  const origin = usePageOrigin();
  const host = usePortalHost();
  const slotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLButtonElement>(null);
  const [bubbleSize, setBubbleSize] = useState({ width: 0, height: 0 });
  const avatar = origin ? `${origin}${persona.portraitSrc}` : persona.portraitSrc;

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    return watchPoweredByBanner(slot);
  }, [host]);

  const line = !copy ? "" : invitation === "callback" ? copy.callback : copy.greeting;
  const bubbleSide = placement === "bottom-right" ? "right" : "left";

  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setBubbleSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [host, line, placement]);

  if (!host || !copy) return null;
  const invitationParts = aishaInvitationParts(line);
  const bubblePath =
    bubbleSize.width > 0 && bubbleSize.height > 0
      ? aishaSpeechBubblePath(bubbleSize.width, bubbleSize.height, bubbleSide)
      : "";
  const agentId = agentIdOverride?.trim() || persona.agentId;

  return createPortal(
    <div
      ref={slotRef}
      className="aisha-convai-slot"
      data-testid="aisha-convai"
      data-persona={persona.id}
      data-placement={placement}
    >
      <style>{BUBBLE_STYLE}</style>
      <button
        ref={labelRef}
        type="button"
        className="aisha-convai-label"
        data-start-label={copy.startCall}
        onClick={startAishaConversation}
      >
        {bubblePath ? (
          <span className="aisha-bubble-shape" aria-hidden="true">
            <span
              className="aisha-bubble-glass"
              style={{ clipPath: `path('${bubblePath}')` }}
            />
            <svg
              className="aisha-bubble-stroke"
              width={bubbleSize.width}
              height={bubbleSize.height}
            >
              <path
                d={bubblePath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.92)"
                strokeWidth="1"
              />
            </svg>
          </span>
        ) : null}
        <span className="aisha-convai-copy">
          <span className="aisha-convai-lead">{invitationParts.lead}</span>
          {invitationParts.rest ? (
            <span className="aisha-convai-rest"> {invitationParts.rest}</span>
          ) : null}
        </span>
      </button>
      <elevenlabs-convai
        agent-id={agentId}
        dynamic-variables={dynamicVariables || undefined}
        action-text={line}
        aria-label={line}
        start-call-text={copy.startCall}
        end-call-text={copy.endCall}
        expand-text={copy.openChat}
        avatar-image-url={avatar}
        avatar-orb-color-1="#046BD9"
        avatar-orb-color-2="#d6e8fb"
        variant="compact"
        placement={placement}
      />
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
        async
      />
    </div>,
    host,
  );
}
