"use client";

import Script from "next/script";
import { useSyncExternalStore, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";
import {
  DEFAULT_ASSISTANT_PERSONA,
  type AssistantPersona,
} from "@/lib/talispros/assistant-personas";

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
  const avatar = origin ? `${origin}${persona.portraitSrc}` : persona.portraitSrc;
  if (!host || !copy) return null;
  const line = invitation === "callback" ? copy.callback : copy.greeting;

  return createPortal(
    <div
      className="aisha-convai-slot"
      data-testid="aisha-convai"
      data-persona={persona.id}
      data-placement={placement}
    >
      <button
        type="button"
        className="aisha-convai-label"
        data-start-label={copy.startCall}
        onClick={startAishaConversation}
      >
        {line}
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
