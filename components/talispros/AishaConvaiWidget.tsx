"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";
import { AISHA_AVATAR_SRC } from "@/components/talispros/WorkingPageCtaLink";

const AGENT_ID = "agent_0401m7cxgba1fhwb35aqr43acnv1";

function usePageOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

/**
 * Public Aisha voice and chat widget on the homepage.
 * The embed script loads after the page is interactive. No API key.
 */
export default function AishaConvaiWidget() {
  const copy = useT().home.aisha;
  const origin = usePageOrigin();
  const avatar = origin ? `${origin}${AISHA_AVATAR_SRC}` : AISHA_AVATAR_SRC;

  return (
    <div className="aisha-convai-slot" data-testid="aisha-convai">
      <p className="aisha-convai-label">{copy.label}</p>
      <elevenlabs-convai
        agent-id={AGENT_ID}
        action-text={copy.action}
        start-call-text={copy.startCall}
        end-call-text={copy.endCall}
        expand-text={copy.openChat}
        avatar-image-url={avatar}
        avatar-orb-color-1="#046BD9"
        avatar-orb-color-2="#d6e8fb"
        variant="compact"
      />
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
        async
      />
    </div>
  );
}
