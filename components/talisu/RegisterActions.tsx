"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SELECTED,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import { redeemRegisterEntryAction } from "@/app/talisu/reg/actions";

export type RegisterActionLabels = {
  label: string;
  propose: string;
  claim: string;
  terms: string;
  register: string;
  entryTitle: string;
  entryBody: string;
  entryLabel: string;
  entrySubmit: string;
  entryChecking: string;
  entryBad: string;
  entryTooMany: string;
  entryNotReady: string;
  entryNeeded: string;
  close: string;
};

/** Where the first three buttons go (decided on the server page). */
export type RegisterActionHrefs = {
  propose: string;
  claim: string;
  terms: string;
  /** Structure step, opened once the entry code is accepted. */
  register: string;
};

const GRID =
  "grid grid-cols-1 gap-2.5 @min-[19rem]:grid-cols-2 @min-[34rem]:grid-cols-4";

/**
 * Aisha's four buttons on /talisu/reg (Arun, Oct 31), in this order:
 * Propose Project · Claim Market · Terms of Service (the Service Agreement,
 * STEP 3 · CONTRACT) · Register. Register asks for the entry code an agent
 * issued; only a code the server accepts opens registration. The checkout
 * route checks the same entry server-side, so the button is not the lock.
 */
export default function RegisterActions({
  labels,
  hrefs,
  entryGranted,
  initialOpen = false,
}: {
  labels: RegisterActionLabels;
  hrefs: RegisterActionHrefs;
  entryGranted: boolean;
  /** Open the entry-code panel on load (bounced from a locked step). */
  initialOpen?: boolean;
}) {
  const router = useRouter();
  const baseId = useId();
  const [open, setOpen] = useState(initialOpen && !entryGranted);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const tab = `${METAL_TAB} ${METAL_TAB_UNSELECTED} cursor-pointer`;
  const items = [
    { id: "propose", label: labels.propose, href: hrefs.propose },
    { id: "claim", label: labels.claim, href: hrefs.claim },
    { id: "terms", label: labels.terms, href: hrefs.terms },
  ] as const;

  return (
    <div className="mt-4 sm:mt-6" data-testid="register-actions">
      <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
        {labels.label}
      </div>
      <div className="@container">
        <div className={GRID}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              data-testid={`register-action-${item.id}`}
              className={tab}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>{item.label}</span>
            </Link>
          ))}
          {entryGranted ? (
            <Link
              href={hrefs.register}
              data-testid="register-action-register"
              className={tab}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>{labels.register}</span>
            </Link>
          ) : (
            <button
              type="button"
              data-testid="register-action-register"
              aria-expanded={open}
              aria-controls={`${baseId}-entry`}
              onClick={() => {
                setOpen((v) => !v);
                setError(null);
              }}
              className={`${METAL_TAB} ${open ? METAL_TAB_SELECTED : METAL_TAB_UNSELECTED} cursor-pointer`}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>{labels.register}</span>
            </button>
          )}
        </div>
      </div>

      {open && !entryGranted ? (
        <form
          id={`${baseId}-entry`}
          data-testid="register-entry"
          className="relative mt-3 rounded-2xl border border-white/80 bg-[#fafaf7] px-4 py-4 text-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await redeemRegisterEntryAction({ code });
              if (res.ok) {
                router.push(hrefs.register);
                return;
              }
              setError(
                res.error === "tooMany"
                  ? labels.entryTooMany
                  : res.error === "notReady"
                    ? labels.entryNotReady
                    : labels.entryBad,
              );
            });
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-[15px] font-semibold tracking-wide text-neutral-900 sm:text-[16px]">
              {labels.entryTitle}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="-mr-1 -mt-1 rounded-full px-2 text-[20px] leading-none text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-[13.5px] leading-relaxed text-neutral-700 sm:text-[14px]">
            {initialOpen ? labels.entryNeeded : labels.entryBody}
          </div>
          <label className="mt-3 block text-[13px] font-semibold text-neutral-700">
            {labels.entryLabel}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              data-testid="register-entry-code"
              className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-[#046BD9] focus:ring-2 focus:ring-[#046BD9]/20"
            />
          </label>
          {error ? (
            <div role="alert" data-testid="register-entry-error" className="mt-2 text-[13px] font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={pending || code.trim().length < 6}
            data-testid="register-entry-submit"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-[#046BD9] px-6 py-2 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none sm:text-[16px]"
          >
            {pending ? labels.entryChecking : labels.entrySubmit} <span aria-hidden className="ml-2">→</span>
          </button>
        </form>
      ) : null}
    </div>
  );
}
