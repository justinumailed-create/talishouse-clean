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
          className="relative flex shrink-0 justify-center pt-6 lg:block lg:h-auto lg:min-h-[calc(100dvh-4.25rem)] lg:overflow-hidden lg:bg-[#2a2a2a] lg:pt-0"
          data-testid={`${testId}-photo`}
        >
          {/* Phones and tablets: a small profile photo, like on the homepage. */}
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-neutral-200 shadow-[0_6px_14px_rgba(0,0,0,0.14)] ring-1 ring-black/10 lg:hidden">
            <Image
              src={persona.portraitSrc}
              alt={title}
              fill
              priority
              sizes="96px"
              className="object-cover"
              style={{ objectPosition: "center 16%" }}
            />
          </div>
          {/* Desktop: the full photo panel on the left. */}
          <div className="absolute inset-0 hidden lg:block">
            <Image
              src={persona.portraitSrc}
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          </div>
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
