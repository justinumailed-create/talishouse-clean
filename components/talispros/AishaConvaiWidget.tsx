"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import { aishaInvitationParts } from "@/lib/talispros/aisha-invitation";
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
  margin: 0 0 14px;
  max-width: min(18.5rem, calc(100vw - 2rem));
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  backdrop-filter: saturate(180%) blur(28px);
  padding: 14px 16px;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.011em;
  text-align: left;
  text-wrap: balance;
  color: #1d1d1f;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.88);
  pointer-events: auto;
  cursor: pointer;
}
.aisha-convai-lead { font-weight: 500; }
.aisha-convai-rest { font-weight: 400; }
.aisha-convai-label::after {
  content: "";
  position: absolute;
  z-index: 2;
  left: 28px;
  bottom: -8px;
  width: 16px;
  height: 16px;
  background: rgba(255, 255, 255, 0.72);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.08);
  transform: rotate(45deg);
}
.aisha-convai-slot[data-placement="bottom-right"] .aisha-convai-label::after {
  left: auto;
  right: 28px;
}
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
}: {
  persona?: AssistantPersona;
  /** Homepage greeting, or the call-back line used on an allowlisted Mapsite. */
  invitation?: "greeting" | "callback";
  placement?: "bottom-left" | "bottom-right";
}) {
  const copy = useT().home.assistants[persona.id];
  const origin = usePageOrigin();
  const host = usePortalHost();
  const slotRef = useRef<HTMLDivElement>(null);
  const avatar = origin ? `${origin}${persona.portraitSrc}` : persona.portraitSrc;

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    return watchPoweredByBanner(slot);
  }, [host]);

  if (!host || !copy) return null;
  const line = invitation === "callback" ? copy.callback : copy.greeting;
  const invitationParts = aishaInvitationParts(line);

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
        type="button"
        className="aisha-convai-label"
        data-start-label={copy.startCall}
        onClick={startAishaConversation}
      >
        <span className="aisha-convai-lead">{invitationParts.lead}</span>
        {invitationParts.rest ? (
          <span className="aisha-convai-rest"> {invitationParts.rest}</span>
        ) : null}
      </button>
      <elevenlabs-convai
        agent-id={persona.agentId}
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
