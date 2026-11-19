"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";

/**
 * Aisha and Webster under the homepage structure tiles.
 * The bubble and Start a call open the guide page. They do not place a call.
 */
export default function HomeAgentPair() {
  const t = useT();
  const aisha = t.home.assistants.aisha;
  const webster = t.home.assistants.webster;

  return (
    <div
      className="mx-auto mt-3 grid w-full max-w-3xl grid-cols-2 grid-rows-[auto_auto_auto] gap-x-3 gap-y-2 border-t border-white/45 pt-3 sm:gap-x-4"
      data-testid="home-agent-pair"
    >
      <AgentCard
        href="/aisha"
        testId="home-aisha-card"
        name={aisha.panelTitle}
        src={ASSISTANT_PERSONAS.aisha.portraitSrc}
        line={aisha.homeBubble}
        call={aisha.startCall}
        compact
      />
      <AgentCard
        href="/webster/project"
        testId="home-webster-card"
        name={webster.panelTitle}
        src={ASSISTANT_PERSONAS.webster.portraitSrc}
        line={webster.projectIntro}
        call={webster.startCall}
      />
    </div>
  );
}

function AgentCard({
  href,
  testId,
  name,
  src,
  line,
  call,
  compact = false,
}: {
  href: string;
  testId: string;
  name: string;
  src: string;
  line: string;
  call: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="col-span-1 row-span-3 grid grid-rows-subgrid justify-items-center text-center no-underline"
    >
      <span className="relative block h-36 w-36 overflow-hidden rounded-2xl bg-neutral-300 shadow-[0_8px_18px_rgba(0,0,0,0.22)] ring-1 ring-white/70 sm:h-44 sm:w-44">
        <Image
          src={src}
          alt={name}
          fill
          sizes="176px"
          className="object-cover"
          style={{ objectPosition: "center 16%" }}
        />
      </span>
      <span
        className={`relative mb-1 inline-flex w-fit items-center justify-center self-center justify-self-center rounded-2xl bg-white text-center font-sans font-medium leading-snug text-neutral-950 shadow-[0_6px_16px_rgba(0,0,0,0.12)] ring-1 ring-black/10 ${
          compact ? "px-2.5 py-1 text-[12px] sm:text-[13px]" : "px-2.5 py-1.5 text-[12px] sm:px-3 sm:text-[13px]"
        }`}
        style={{ maxWidth: compact ? "15.5rem" : "100%", width: "fit-content" }}
      >
        {line}
        <span
          className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-white"
          aria-hidden
        />
      </span>
      <span className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#046BD9] px-4 font-sans text-[14px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.28)] sm:text-[15px]">
        {call}
      </span>
    </Link>
  );
}
