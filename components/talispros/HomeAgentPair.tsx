"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ASSISTANT_PERSONAS } from "@/lib/talispros/assistant-personas";

/**
 * Aisha and Webster in the homepage left column, under Build Mapsite.
 * The photo, the bubble and Start a call all open the guide page with the call
 * already starting, so the bot speaks first with no second click.
 */
export default function HomeAgentPair() {
  const t = useT();
  const aisha = t.home.assistants.aisha;
  const webster = t.home.assistants.webster;

  return (
    <div
      className="mx-auto mt-6 grid w-full max-w-[24rem] grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:grid-rows-[auto_auto_auto] sm:gap-x-4 sm:gap-y-1.5 lg:mt-4"
      data-testid="home-agent-pair"
    >
      <AgentCard
        href="/aisha"
        callHref="/aisha?call=1"
        testId="home-aisha-card"
        name={aisha.panelTitle}
        src={ASSISTANT_PERSONAS.aisha.portraitSrc}
        line={aisha.homeBubble}
        call={aisha.startCall}
      />
      <AgentCard
        href="/webster/project"
        callHref="/webster/project?call=1"
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
  callHref,
  testId,
  name,
  src,
  line,
  call,
}: {
  href: string;
  callHref: string;
  testId: string;
  name: string;
  src: string;
  line: string;
  call: string;
}) {
  return (
    <div
      data-testid={testId}
      className="col-span-1 grid justify-items-center text-center sm:row-span-3 sm:grid-rows-subgrid"
    >
      <Link
        href={callHref}
        className="relative block h-20 w-20 overflow-hidden rounded-2xl bg-neutral-200 shadow-[0_6px_14px_rgba(0,0,0,0.14)] ring-1 ring-black/10"
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes="80px"
          className="object-cover"
          style={{ objectPosition: "center 16%" }}
        />
      </Link>
      <Link
        href={callHref}
        className="relative mb-1 mt-1.5 flex h-full min-h-[4rem] w-[12.75rem] items-center justify-center rounded-2xl bg-[#f4f6f8] px-3 whitespace-pre-line text-center font-sans text-[12.5px] font-medium leading-[1.3] text-neutral-950 no-underline shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/10"
      >
        {line}
        <span
          className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#f4f6f8]"
          aria-hidden
        />
      </Link>
      <Link
        href={callHref}
        data-testid={`${testId}-call`}
        className="mt-1 inline-flex min-h-8 items-center justify-center rounded-full bg-[#046BD9] px-4 font-sans text-[13px] font-semibold text-white no-underline shadow-[0_4px_10px_rgba(4,107,217,0.25)]"
      >
        {call}
      </Link>
    </div>
  );
}
