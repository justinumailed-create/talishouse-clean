"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import {
  clearPmcContractAgentAction,
  signPmcContractAction,
  unlockPmcContractAction,
} from "@/app/talisu/contract/actions";
import { validateContractSignature } from "@/lib/talispros/mapsite-contract";

const field =
  "w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-[#0069CF] focus:ring-2 focus:ring-[#0069CF]/20";

/** Step A: agent code → unlock. */
export function ContractUnlockForm({
  fastCode,
  initialCode,
}: {
  fastCode: string | null;
  initialCode: string;
}) {
  const t = useT().pmc.contract;
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      data-testid="pmc-contract-unlock"
      className="mx-auto max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await unlockPmcContractAction({ code, fastCode });
          if (res.ok) router.refresh();
          else setError(res.error === "tooMany" ? t.tooMany : t.badCode);
        });
      }}
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0069CF]/10 text-2xl">🔒</div>
      <h2 className="mt-4 text-center text-2xl font-black text-[#06182f]">{t.lockedTitle}</h2>
      <p className="mt-2 text-center text-[15px] text-neutral-600">{t.lockedBody}</p>
      <label className="mt-6 block text-[13px] font-semibold text-neutral-700">
        {t.codeLabel}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="TP-XXXXXX"
          autoComplete="off"
          spellCheck={false}
          className={`${field} mt-1.5 text-center font-mono text-xl tracking-[0.25em]`}
        />
      </label>
      {error ? <p className="mt-3 text-center text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || code.trim().length < 6}
        className="mt-5 w-full rounded-full bg-[#0069CF] py-3 text-sm font-bold text-white shadow-lg shadow-[#0069CF]/25 hover:bg-[#0058ad] disabled:opacity-50"
      >
        {pending ? t.unlocking : t.unlock}
      </button>
    </form>
  );
}

/** Step B: e-signature (typed or drawn) → record → Register (Aisha). */
export function ContractSignForm({
  agentName,
  fastCode,
}: {
  agentName: string;
  fastCode: string | null;
}) {
  const t = useT().pmc.contract;
  const router = useRouter();
  const [business, setBusiness] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const fc = fastCode?.toUpperCase() ?? "";
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typed, setTyped] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || mode !== "drawn") return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#06182f";
  }, [mode]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  function submit() {
    setError(null);
    const input = {
      signerName: name,
      signerBusiness: business,
      signerEmail: email,
      fastCode: fc,
      signatureType: mode,
      signatureText: mode === "typed" ? typed : null,
      signatureImage: mode === "drawn" ? image : null,
      consent,
    };
    const invalid = validateContractSignature(input);
    if (invalid) {
      setError(t[invalid]);
      return;
    }
    start(async () => {
      const res = await signPmcContractAction(input);
      if (!res.ok) {
        if (res.error === "locked") router.refresh();
        setError(
          res.error in t ? (t as Record<string, string>)[res.error] ?? res.error : res.error,
        );
        return;
      }
      setDone(true);
      router.push(res.href);
    });
  }

  return (
    <div data-testid="pmc-contract-sign" className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
          ✓ {t.authorisedBy.replace("{name}", agentName)}
        </span>
        <button
          type="button"
          className="text-[12px] font-medium text-neutral-500 underline hover:text-neutral-800"
          onClick={() => start(async () => {
            await clearPmcContractAgentAction();
            router.refresh();
          })}
        >
          {t.changeAgent}
        </button>
      </div>
      <h2 className="mt-5 text-xl font-black text-[#06182f]">{t.customer}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-[13px] font-semibold text-neutral-700">
          {t.business}
          <input className={`${field} mt-1.5`} value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={200} />
        </label>
        <label className="text-[13px] font-semibold text-neutral-700">
          {t.representative}
          <input className={`${field} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
        </label>
        <label className="text-[13px] font-semibold text-neutral-700">
          {t.email}
          <input className={`${field} mt-1.5`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="text-[13px] font-semibold text-neutral-700">
          {t.fastCode}
          <input className={`${field} mt-1.5 bg-neutral-50 font-mono uppercase`} value={fc} readOnly aria-readonly="true" />
        </label>
      </div>

      <div className="mt-6 inline-flex rounded-full bg-neutral-100 p-1 text-[13px] font-semibold">
        {(["typed", "drawn"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 ${mode === m ? "bg-white text-[#0069CF] shadow" : "text-neutral-600"}`}
          >
            {m === "typed" ? t.typed : t.drawn}
          </button>
        ))}
      </div>
      {mode === "typed" ? (
        <div className="mt-3">
          <input
            className={`${field} font-[cursive] text-3xl italic`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={name || "Your name"}
            maxLength={120}
          />
          <p className="mt-1 text-[12px] text-neutral-500">{t.typedHint}</p>
        </div>
      ) : (
        <div className="mt-3">
          <canvas
            ref={canvasRef}
            className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-black/20 bg-[#fbfdff]"
            onPointerDown={(e) => {
              drawing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              const ctx = e.currentTarget.getContext("2d");
              const [x, y] = point(e);
              ctx?.beginPath();
              ctx?.moveTo(x, y);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = e.currentTarget.getContext("2d");
              const [x, y] = point(e);
              ctx?.lineTo(x, y);
              ctx?.stroke();
            }}
            onPointerUp={(e) => {
              drawing.current = false;
              setImage(e.currentTarget.toDataURL("image/png"));
            }}
          />
          <div className="mt-1 flex items-center justify-between text-[12px] text-neutral-500">
            <span>{t.drawHint}</span>
            <button
              type="button"
              className="font-semibold text-[#0069CF]"
              onClick={() => {
                const c = canvasRef.current;
                c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
                setImage(null);
              }}
            >
              {t.clear}
            </button>
          </div>
        </div>
      )}

      <label className="mt-5 flex items-start gap-3 text-[14px] text-neutral-700">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0069CF]" />
        {t.consent}
      </label>
      <p className="mt-2 text-[12px] text-neutral-500">{t.recordNote}</p>
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={pending || done}
        className="mt-5 w-full rounded-full bg-[#0069CF] py-3.5 text-base font-bold text-white shadow-lg shadow-[#0069CF]/25 hover:bg-[#0058ad] disabled:opacity-60"
      >
        {done ? t.signed : pending ? t.signing : `${t.submit} →`}
      </button>
    </div>
  );
}
