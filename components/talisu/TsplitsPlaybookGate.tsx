"use client";

import { useId, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import {
  TSPLITS_PLAYBOOK_UNLOCK_API,
  type TsplitsPlaybookCopy,
  type TsplitsPlaybookUnlockError,
} from "@/lib/talisu/tsplits-playbook";

const FIELD =
  "mt-2 block w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition focus:border-neutral-700 focus:ring-4 focus:ring-neutral-700/15";

/** Locked view: Tsplits™ mark, title and one passcode field (nothing else). */
export default function TsplitsPlaybookGate({
  copy,
  available,
  initialError,
}: {
  copy: TsplitsPlaybookCopy;
  available: boolean;
  initialError: TsplitsPlaybookUnlockError | null;
}) {
  const id = useId();
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<TsplitsPlaybookUnlockError | null>(
    available ? initialError : "unavailable",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !passcode.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(TSPLITS_PLAYBOOK_UNLOCK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: TsplitsPlaybookUnlockError }
        | null;
      if (res.ok && data?.ok) {
        setPasscode("");
        router.replace(window.location.pathname);
        router.refresh();
        return;
      }
      setError(data && !data.ok ? data.error : "unavailable");
    } catch {
      setError("unavailable");
    }
    setSending(false);
  }

  const message = error ? copy[error] : null;

  return (
    <div
      data-testid="tsplits-playbook-gate"
      className="talis-discuss-surface flex items-center justify-center px-5 py-16 text-[#1d1d1f] antialiased sm:py-24"
      style={{ minHeight: "calc(100dvh - 68px)" }}
    >
      <div style={{ width: "100%", maxWidth: 440 }} className="rounded-[28px] border border-black/[0.06] bg-white px-7 pb-9 pt-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_rgba(18,53,91,0.10)] sm:px-10">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0069CF] shadow-[0_8px_20px_rgba(0,105,207,0.25)]">
            <Image src="/logo-mark.png" alt="" width={40} height={43} className="h-10 w-auto" priority />
          </span>
        </div>
        <p className="mt-6 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {copy.kicker}
        </p>
        <h1 className="mt-2 text-center text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
          {copy.title}
        </h1>

        {available ? (
          <form
            method="post"
            action={TSPLITS_PLAYBOOK_UNLOCK_API}
            onSubmit={onSubmit}
            className="mt-8 space-y-5"
            data-testid="tsplits-playbook-form"
          >
            <p className="text-center text-[15px] leading-relaxed text-neutral-600">{copy.intro}</p>
            <div>
              <label htmlFor={`${id}-passcode`} className="block text-[13px] font-medium text-[#1d1d1f]">
                {copy.passcode}
              </label>
              <input
                id={`${id}-passcode`}
                name="passcode"
                type="password"
                required
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={message ? `${id}-error` : undefined}
                data-testid="tsplits-playbook-passcode"
                className={`${FIELD} ${error ? "border-red-400" : ""}`}
              />
              {message ? (
                <p id={`${id}-error`} role="alert" className="mt-2 text-[13px] text-red-600">
                  {message}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={sending}
              data-testid="tsplits-playbook-submit"
              className={`${METAL_TAB} ${METAL_TAB_UNSELECTED} w-full cursor-pointer disabled:opacity-60`}
              style={{ backgroundImage: ADVISER_METAL_BG }}
            >
              <span className={METAL_TAB_SHEEN} aria-hidden />
              <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>
                {sending ? copy.checking : copy.submit}
              </span>
            </button>
          </form>
        ) : (
          <p
            role="status"
            data-testid="tsplits-playbook-unavailable"
            className="mt-6 text-center text-[15px] leading-relaxed text-neutral-600"
          >
            {copy.unavailable}
          </p>
        )}
      </div>
    </div>
  );
}
