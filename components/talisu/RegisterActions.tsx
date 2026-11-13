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
import SecretTextField from "@/components/talispros/SecretTextField";
import {
  isRegisterCheckoutId,
  registerCheckoutPath,
} from "@/lib/talisu/register-checkout";

export type RegisterActionLabels = {
  label: string;
  propose: string;
  claim: string;
  terms: string;
  register: string;
  checkouts: ReadonlyArray<{ id: string; label: string; listLabel?: string }>;
  consentBefore: string;
  consentTerms: string;
  consentAnd: string;
  consentPrivacy: string;
  consentAfter: string;
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
  "grid grid-cols-2 gap-2.5 @min-[28rem]:grid-cols-3 @min-[46rem]:grid-cols-5";

/**
 * Account checkouts on /talisu/reg, in this order:
 * Broker · Agent · FSBO · Adpro · PIN. Each opens a first-party page.
 * SamCart addresses are not in this component. Without an agent code the
 * button opens the code form; the checkout page checks the code again.
 */
export default function RegisterActions({
  labels,
  hrefs,
  entryGranted,
  initialOpen = false,
  nextProduct = null,
}: {
  labels: RegisterActionLabels;
  hrefs: RegisterActionHrefs;
  entryGranted: boolean;
  /** Open the entry-code panel on load (bounced from a locked step). */
  initialOpen?: boolean;
  /** Product the visitor was sent back from, when the checkout was locked. */
  nextProduct?: string | null;
}) {
  const router = useRouter();
  const baseId = useId();
  const [open, setOpen] = useState(initialOpen && !entryGranted);
  const [chosen, setChosen] = useState<string | null>(
    nextProduct && isRegisterCheckoutId(nextProduct) ? nextProduct : null,
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const tab = `${METAL_TAB} ${METAL_TAB_UNSELECTED} cursor-pointer`;

  function goAfterCode(productId: string | null) {
    const id =
      productId && isRegisterCheckoutId(productId)
        ? productId
        : chosen && isRegisterCheckoutId(chosen)
          ? chosen
          : null;
    router.push(id ? registerCheckoutPath(id) : hrefs.register);
    router.refresh();
  }

  return (
    <div className="mt-4 sm:mt-6" data-testid="register-actions">
      <div className="mb-3 text-[15px] font-medium leading-relaxed text-neutral-950 sm:text-[16px]">
        {labels.label}
      </div>
      <div className="@container">
        <div className={GRID}>
          {labels.checkouts.map((item) => {
            const inner = (
              <>
                <span className={METAL_TAB_SHEEN} aria-hidden />
                <span className={`${METAL_TAB_LABEL} text-balance leading-tight`}>
                  {item.listLabel ?? item.label}
                </span>
              </>
            );
            if (entryGranted && isRegisterCheckoutId(item.id)) {
              return (
                <Link
                  key={item.id}
                  href={registerCheckoutPath(item.id)}
                  data-testid={`register-action-${item.id}`}
                  className={tab}
                  style={{ backgroundImage: ADVISER_METAL_BG }}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`register-action-${item.id}`}
                className={tab}
                style={{ backgroundImage: ADVISER_METAL_BG }}
                onClick={() => {
                  setChosen(item.id);
                  setError(null);
                  setOpen(true);
                }}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[40rem] text-center text-[13px] leading-relaxed text-neutral-600" data-testid="register-consent">
        {labels.consentBefore}{" "}
        <Link href="/terms" className="font-semibold text-[#046BD9] underline-offset-2 hover:underline">
          {labels.consentTerms}
        </Link>{" "}
        {labels.consentAnd}{" "}
        <Link href="/privacy" className="font-semibold text-[#046BD9] underline-offset-2 hover:underline">
          {labels.consentPrivacy}
        </Link>
        {labels.consentAfter}
      </p>

      {open && !entryGranted ? (
        <form
          id={`${baseId}-entry`}
          data-testid="register-entry"
          method="post"
          className="relative mt-3 rounded-2xl border border-white/80 bg-[#fafaf7] px-4 py-4 text-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await redeemRegisterEntryAction({ code });
              if (res.ok) {
                goAfterCode(chosen);
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
            <SecretTextField
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="off"
              data-testid="register-entry-code"
              aria-label={labels.entryLabel}
              wrapperClassName="relative mt-1.5 w-full"
              className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-[#046BD9] focus:ring-2 focus:ring-[#046BD9]/20"
            />
          </label>
          {error ? (
            <div role="alert" data-testid="register-entry-error" className="mt-2 text-[13px] font-semibold text-red-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={pending || code.trim().length === 0}
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
