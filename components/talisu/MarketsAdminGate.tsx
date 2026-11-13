"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockMarketsAdminAction } from "@/app/talisu/mkts/actions";
import SecretTextField from "@/components/talispros/SecretTextField";
import { useT } from "@/lib/i18n/client";

/** Second door into Global Admin: the existing password opens this map and the admin session. */
export default function MarketsAdminGate() {
  const t = useT().markets.adminGate;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="talis-working-bg flex min-h-[70vh] items-center justify-center px-4 py-16 text-neutral-950">
      <form
        data-testid="markets-admin-gate"
        method="post"
        className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          start(async () => {
            const res = await unlockMarketsAdminAction({ password });
            if (res.ok) {
              setPassword("");
              router.refresh();
              return;
            }
            setError(res.error === "limited" ? t.limited : res.error === "failed" ? t.failed : t.wrong);
          });
        }}
      >
        <h1 className="m-0 text-[22px] font-semibold tracking-tight text-neutral-950">{t.title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{t.body}</p>
        <label className="mt-5 block text-[13px] font-semibold text-neutral-700">
          {t.label}
          <SecretTextField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            data-testid="markets-admin-password"
            aria-label={t.label}
            wrapperClassName="relative mt-1.5 w-full"
            className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#046BD9] focus:ring-2 focus:ring-[#046BD9]/20"
          />
        </label>
        {error ? (
          <p role="alert" data-testid="markets-admin-error" className="mt-3 text-[13px] font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || password.trim().length === 0}
          data-testid="markets-admin-submit"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#046BD9] px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
        >
          {pending ? t.checking : t.submit}
        </button>
      </form>
    </div>
  );
}
