"use client";

import { useState, useTransition } from "react";
import { assignDemoEbookAction } from "@/app/talispros/demo-mapsite/assign-actions";
import { openClaimedMapSiteFromHomeFastCode } from "@/app/talispros/mapsites/actions";
import { useT } from "@/lib/i18n/client";
import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";

const buttonClass =
  "flex h-12 w-full items-center justify-center rounded-full px-5 text-[15px] font-medium transition disabled:opacity-40";

/**
 * After the PDF is built: attach this FAST Code to an existing account
 * (homepage account open, then the assign-to-account action), or keep the demo.
 */
export default function DemoFinishChoice({
  mapsiteId,
  fastCode,
  keepHref,
}: {
  mapsiteId: string;
  fastCode: string;
  keepHref: string;
}) {
  const d = useT().demo;
  const f = d.finish;
  const [mode, setMode] = useState<"choose" | "attach">("choose");
  const [accountCode, setAccountCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notPaid, setNotPaid] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const [pending, start] = useTransition();

  function keepDemo() {
    if (keeping || pending) return;
    setKeeping(true);
    window.location.assign(keepHref);
  }

  function attach() {
    setError(null);
    setNotPaid(false);
    start(async () => {
      const opened = await openClaimedMapSiteFromHomeFastCode(accountCode).catch(() => null);
      if (!opened?.success) {
        setError(opened?.error || d.assignError);
        return;
      }
      const result = await assignDemoEbookAction({
        mapsiteId,
        fastCode: accountCode,
      }).catch(() => null);
      if (!result) {
        setError(d.assignError);
        return;
      }
      if (!result.ok) {
        if (result.reason === "not_paid") {
          setNotPaid(true);
          return;
        }
        setError(result.error);
        return;
      }
      window.location.assign(result.href);
    });
  }

  return (
    <section
      className="mt-10 overflow-hidden rounded-[28px] bg-white px-6 py-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]"
      data-testid="demo-finish-choice"
      aria-labelledby="demo-finish-title"
    >
      <p className="text-[12px] font-medium tracking-[0.22em] text-neutral-400">{f.eyebrow}</p>
      <h2
        id="demo-finish-title"
        className="mt-4 text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-neutral-950 sm:text-[34px]"
      >
        {f.title}
      </h2>
      <p className="mx-auto mt-3 max-w-[26rem] text-[15px] leading-relaxed text-neutral-600">{f.lead}</p>
      {fastCode ? (
        <p className="mt-5 text-[13px] text-neutral-500">
          {f.codeLabel}{" "}
          <span
            className="font-mono text-[15px] font-semibold tracking-[0.12em] text-neutral-950"
            data-testid="demo-finish-code"
          >
            {fastCode.trim().toUpperCase()}
          </span>
        </p>
      ) : null}

      {mode === "choose" ? (
        <div className="mx-auto mt-8 flex max-w-[22rem] flex-col gap-3">
          <button
            type="button"
            data-testid="demo-finish-attach"
            onClick={() => {
              setError(null);
              setNotPaid(false);
              setMode("attach");
            }}
            className={`${buttonClass} text-white hover:brightness-95`}
            style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
          >
            {f.attach}
          </button>
          <button
            type="button"
            data-testid="demo-finish-keep"
            disabled={keeping}
            onClick={keepDemo}
            className={`${buttonClass} border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50`}
          >
            {keeping ? f.keeping : f.keep}
          </button>
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-[22rem] space-y-3 text-left">
          <p className="text-[13px] leading-relaxed text-neutral-600">{d.assignPrompt}</p>
          <label className="block">
            <span className="text-[12px] font-medium text-neutral-500">{d.slots.inputLabel}</span>
            <input
              value={accountCode}
              onChange={(event) => {
                setAccountCode(event.target.value.toUpperCase());
                setError(null);
                setNotPaid(false);
              }}
              disabled={pending}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              data-testid="demo-finish-account-code"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
            />
          </label>
          {notPaid ? (
            <p
              role="alert"
              className="rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-200"
            >
              <span className="font-semibold">{d.assignNotPaidTitle}</span> {d.assignNotPaidBody}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-[13px] leading-relaxed text-red-600">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setMode("choose");
                setError(null);
                setNotPaid(false);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {d.cancel}
            </button>
            <button
              type="button"
              data-testid="demo-finish-attach-submit"
              disabled={pending || !accountCode.trim()}
              onClick={attach}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
            >
              {pending ? d.assigning : d.assignSubmit}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
