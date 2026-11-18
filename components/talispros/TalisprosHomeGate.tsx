"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AISHA_CALL_PATH, aishaSignInPath } from "@/lib/talispros/aisha-call-path";
import { PITCH_DONE_EVENT, readPitchDone } from "@/lib/talispros/pitch-gate";
import TalisprosHomeFastCodeEntry from "@/components/talispros/TalisprosHomeFastCodeEntry";
import TalisprosLegalCopy from "@/components/talispros/TalisprosLegalCopy";
import { TALISPROS_HOME_SYSTEM_DEMO_HREF } from "@/lib/talispros/start-content";
import { useT } from "@/lib/i18n/client";

/**
 * Homepage gate left column: Tsplits™ logo + Login (reveals FAST Code) + Build Demo.
 * Keeps the existing claimed-Mapsite cookie/session FAST flow.
 */
export default function TalisprosHomeGate({
  pitchExempt = false,
  signedIn = false,
  websterHref = "/webster?call=1",
}: {
  pitchExempt?: boolean;
  /** Owner session. Unlocks the page and offers Aisha. */
  signedIn?: boolean;
  /** Webster ONE. Includes a FAST Code when the homepage already has one. */
  websterHref?: string;
}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [pitchLocked, setPitchLocked] = useState(false);
  const t = useT();

  useEffect(() => {
    if (pitchExempt) {
      setPitchLocked(false);
      return;
    }
    const sync = () => setPitchLocked(!readPitchDone(window.localStorage));
    sync();
    window.addEventListener(PITCH_DONE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PITCH_DONE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pitchExempt]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
      <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center">
        <div className="mb-8 text-center sm:mb-10">
          <Image
            src="/logo.png"
            alt="Tsplits™"
            width={72}
            height={72}
            className="mx-auto mb-4 h-14 w-14 object-contain sm:h-16 sm:w-16"
            priority
          />
          <h1 className="text-[28px] leading-[1.1] tracking-[0.14em] text-neutral-900 sm:text-[34px]">
            Tsplits™
          </h1>
          <p className="mt-2 text-sm font-medium tracking-[0.14em] text-neutral-500 sm:text-[15px]">
            {t.home.motto}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {signedIn ? (
            <Link
              href={AISHA_CALL_PATH}
              data-testid="home-talk-aisha"
              className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#046BD9] px-6 text-center text-[18px] font-semibold text-white shadow-[0_8px_22px_rgba(4,107,217,0.35)] hover:bg-[#0358b3]"
            >
              {t.home.pitch.talkToAisha}
            </Link>
          ) : null}
          {pitchLocked ? (
            <div data-pitch-free data-testid="home-pitch-start-wrap" className="flex flex-col gap-3">
              <Link
                href={websterHref}
                data-testid="home-pitch-start"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#046BD9] px-6 text-center text-[18px] font-semibold text-white shadow-[0_8px_22px_rgba(4,107,217,0.35)] hover:bg-[#0358b3]"
              >
                {t.home.assistants.webster.startCall}
              </Link>
              <div className="text-center">
                <div className="text-[13px] leading-snug text-neutral-800">{t.home.pitch.note}</div>
                <Link
                  href={aishaSignInPath()}
                  data-testid="home-already-registered"
                  className="mt-2 inline-block text-[13px] font-semibold text-[#046BD9] underline-offset-2 hover:underline"
                >
                  {t.home.pitch.registered}
                </Link>
              </div>
            </div>
          ) : null}
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
          className="mt-8 text-center sm:mt-10"
          primaryClassName="text-xs font-medium leading-snug text-neutral-600 sm:text-sm"
          secondaryClassName="mt-1.5 text-xs font-medium text-neutral-500"
        />
      </div>
    </div>
  );
}
