"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import HomeAgentPair from "@/components/talispros/HomeAgentPair";
import TalisprosHomeFastCodeEntry from "@/components/talispros/TalisprosHomeFastCodeEntry";
import TalisprosLegalCopy from "@/components/talispros/TalisprosLegalCopy";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";
import { useT } from "@/lib/i18n/client";

/**
 * Homepage gate left column: Tsplits™ logo + Login (reveals FAST Code) + Build Demo.
 * Keeps the existing claimed-Mapsite cookie/session FAST flow.
 */
export default function TalisprosHomeGate() {
  const [loginOpen, setLoginOpen] = useState(false);
  const t = useT();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white px-5 pb-8 pt-5 sm:px-10 sm:pb-10 sm:pt-6 lg:px-12 lg:pb-3.5 lg:pt-12">
      <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center lg:justify-between">
        {/* On desktop the top block stays centred and the bots sit at the bottom,
            level with the four transaction tiles on the right. */}
        <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
        <div className="mb-6 flex items-center gap-3 text-left lg:mb-10 lg:block lg:text-center">
          <Image
            src="/logo.png"
            alt="Tsplits™"
            width={72}
            height={72}
            className="h-12 w-12 flex-none object-contain lg:mx-auto lg:mb-4 lg:h-16 lg:w-16"
            priority
          />
          <div>
          <h1 className="text-[24px] leading-[1.1] tracking-[0.14em] text-neutral-900 lg:text-[34px]">
            Tsplits™
          </h1>
          <p className="mt-1 text-[11px] font-medium tracking-[0.14em] text-neutral-500 lg:mt-2 lg:text-[15px]">
            {t.home.motto}
          </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={loginOpen}
            aria-controls="start-login-fast-code"
            onClick={() => setLoginOpen((open) => !open)}
            className={`w-full border-2 px-4 py-3.5 text-center text-[15px] font-medium tracking-wide transition active:scale-[0.99] sm:text-base ${
              loginOpen
                ? "border-[var(--talis-nav-blue)] bg-[var(--talis-nav-blue)] text-white"
                : "border-[var(--talis-nav-blue)] bg-white text-[var(--talis-nav-blue)] hover:bg-[var(--talis-nav-blue)] hover:text-white"
            }`}
          >
            {t.home.openAccount}
          </button>

          <div
            id="start-login-fast-code"
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              loginOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div
                className={`border border-neutral-200 bg-neutral-50 px-3 py-3 transition-opacity duration-300 sm:px-4 sm:py-3.5 ${
                  loginOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {loginOpen ? (
                  <TalisprosHomeFastCodeEntry autoFocus embedded />
                ) : null}
              </div>
            </div>
          </div>

          <Link
            href={TALISPROS_HOME_SYSTEM_DEMO_HREF}
            className="w-full border-2 border-neutral-300 bg-white px-4 py-3.5 text-center text-[15px] font-medium tracking-wide text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-50 active:scale-[0.99] sm:text-base"
          >
            {t.home.systemDemo}
          </Link>
        </div>

        <TalisprosLegalCopy
          className="mt-6 text-center sm:mt-6"
          primaryClassName="text-xs font-medium leading-snug text-neutral-600 sm:text-sm"
          secondaryClassName="mt-1.5 text-xs font-medium text-neutral-500"
        />
        </div>
        <HomeAgentPair />
      </div>
    </div>
  );
}
