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
      className="mx-auto mt-7 grid w-full grid-cols-1 gap-4 lg:mt-4 lg:max-w-[24rem] lg:grid-cols-2 lg:grid-rows-[auto_auto_auto] lg:justify-items-center lg:gap-x-4 lg:gap-y-1.5"
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
      className="col-span-1 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-2xl bg-white p-3 text-left shadow-[0_4px_14px_rgba(0,0,0,0.07)] ring-1 ring-black/5 lg:row-span-3 lg:grid-cols-1 lg:grid-rows-subgrid lg:justify-items-center lg:gap-0 lg:bg-transparent lg:p-0 lg:text-center lg:shadow-none lg:ring-0"
    >
      <Link
        href={callHref}
        className="relative row-span-2 block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full bg-neutral-200 shadow-[0_6px_14px_rgba(0,0,0,0.14)] ring-1 ring-black/10 lg:row-span-1 lg:h-20 lg:w-20 lg:rounded-2xl"
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
        className="relative flex h-full w-full items-center rounded-2xl bg-[#f4f6f8] px-3 py-2 whitespace-pre-line font-sans text-[13.5px] font-medium leading-[1.35] text-[var(--text-secondary)] no-underline ring-1 ring-black/10 lg:mb-1 lg:mt-1.5 lg:min-h-[4rem] lg:w-[12.75rem] lg:justify-center lg:py-0 lg:text-center lg:text-[12.5px] lg:leading-[1.3] lg:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      >
        {line}
        <span
          className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-r-[8px] border-y-transparent border-r-[#f4f6f8] lg:hidden"
          aria-hidden
        />
        <span
          className="absolute left-1/2 top-full hidden h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#f4f6f8] lg:block"
          aria-hidden
        />
      </Link>
      <Link
        href={callHref}
        data-testid={`${testId}-call`}
        className="col-start-2 inline-flex min-h-9 items-center justify-center justify-self-start rounded-full bg-[#046BD9] px-5 font-sans text-[14px] font-semibold text-white no-underline shadow-[0_4px_10px_rgba(4,107,217,0.25)] lg:col-start-1 lg:mt-1 lg:min-h-8 lg:justify-self-center lg:px-4 lg:text-[13px]"
      >
        {call}
      </Link>
    </div>
  );
}
