import Image from "next/image";
import type { ReactNode } from "react";
import LegalLinks from "@/components/legal/LegalLinks";
import GuideConversationPanel from "@/components/talispros/GuideConversationPanel";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import type { AssistantPersona } from "@/lib/talispros/assistant-personas";

/**
 * Photo on the left, the inline conversation on the right.
 * Aisha, Webster, and Thorsten share this layout.
 */
export default function GuideConversationPage({
  persona,
  title,
  heading,
  call,
  dynamicVariables,
  testId,
  imagePosition = "center 18%",
  agentId,
  recordsPitch = false,
  intro,
}: {
  persona: AssistantPersona;
  title: string;
  /** Visible heading. The photo alt stays on `title`. */
  heading?: string;
  call: boolean;
  dynamicVariables?: string;
  testId: string;
  imagePosition?: string;
  /** Webster TWO uses its own agent. Other pages use the persona agent. */
  agentId?: string;
  /** A finished call on this page counts as the homepage pitch. */
  recordsPitch?: boolean;
  /** Written note under the header, before the photo and the call. */
  intro?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-[#f5f1ea]"
      data-testid={`${testId}-page`}
      data-call={call ? "1" : "0"}
    >
      <TalisUMktsHeader />
      {intro}
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div
          className="relative h-44 shrink-0 overflow-hidden bg-[#2a2a2a] sm:h-64 lg:h-auto lg:min-h-[calc(100dvh-4.25rem)]"
          data-testid={`${testId}-photo`}
        >
          <Image
            src={persona.portraitSrc}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
        </div>
        <div
          className="relative min-h-[70dvh] lg:min-h-[calc(100dvh-4.25rem)]"
          data-testid={`${testId}-conversation`}
        >
          <GuideConversationPanel
            agentId={agentId || persona.agentId}
            title={heading ?? title}
            autoStart={call}
            dynamicVariables={dynamicVariables}
            recordsPitch={recordsPitch}
          />
        </div>
      </main>
      <footer className="border-t border-black/10 bg-white px-4 py-4">
        <div className="flex justify-center">
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
