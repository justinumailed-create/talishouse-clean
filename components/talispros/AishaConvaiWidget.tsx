"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
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

/**
 * Public voice and chat widget. The embed script loads after the page is
 * interactive. The spoken first message is set in ElevenLabs, not here.
 */
export default function AishaConvaiWidget({
  persona = DEFAULT_ASSISTANT_PERSONA,
}: {
  persona?: AssistantPersona;
}) {
  const copy = useT().home.assistants[persona.id];
  const origin = usePageOrigin();
  const host = usePortalHost();
  const avatar = origin ? `${origin}${persona.portraitSrc}` : persona.portraitSrc;
  if (!host || !copy) return null;

  return createPortal(
    <div className="aisha-convai-slot" data-testid="aisha-convai" data-persona={persona.id}>
      <p className="aisha-convai-label">{copy.label}</p>
      <elevenlabs-convai
        agent-id={persona.agentId}
        action-text={copy.greeting}
        aria-label={copy.greeting}
        start-call-text={copy.startCall}
        end-call-text={copy.endCall}
        expand-text={copy.openChat}
        avatar-image-url={avatar}
        avatar-orb-color-1="#046BD9"
        avatar-orb-color-2="#d6e8fb"
        variant="compact"
        placement="bottom-left"
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
