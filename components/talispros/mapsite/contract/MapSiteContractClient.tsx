"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import {
  signMapSiteContractAction,
  unlockMapSiteContractAction,
} from "@/app/talispros/mapsite/contract-actions";

type Props = {
  fastCode: string;
  unlocked: boolean;
  contractText: string | null;
  isPlaceholder: boolean;
  propertyAddress: string | null;
};

/** Gated contract: access code → read → in-app e-signature → purchase. */
export default function MapSiteContractClient({
  fastCode,
  unlocked,
  contractText,
  isPlaceholder,
  propertyAddress,
}: Props) {
  const t = useT();
  const c = t.mapsite.contract;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [typed, setTyped] = useState("");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
  }, [mode, unlocked]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function clearPad() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  }

  const code3 = fastCode.toUpperCase();

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {c.eyebrow} · FAST CODE {code3}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">{c.lockedTitle}</h1>
        <p className="mt-2 text-sm text-neutral-600">{c.lockedBody}</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await unlockMapSiteContractAction({ fastCode, code });
              if ("error" in result) {
                setError(result.error === "tooMany" ? c.tooMany : c.badCode);
                return;
              }
              router.refresh();
            });
          }}
        >
          <label htmlFor="contract-code" className="block text-xs font-semibold text-neutral-700">
            {c.codeLabel}
          </label>
          <input
            id="contract-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            autoComplete="one-time-code"
            placeholder="XXXX-XXXX"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-lg tracking-widest"
          />
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || code.trim().length < 8}
            className="w-full rounded-lg bg-[#035bb8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? c.unlocking : c.unlock}
          </button>
        </form>
      </section>
    );
  }

  const errorText = (key: string) =>
    (c as Record<string, string>)[key] || key;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {c.eyebrow}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">
          {fmt(c.title, { code: code3 })}
        </h1>
        {propertyAddress ? (
          <p className="mt-1 text-sm text-neutral-500">{propertyAddress}</p>
        ) : null}
        {isPlaceholder ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {c.placeholderNotice}
          </p>
        ) : null}
        <div className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-800">
          {contractText}
        </div>
      </div>

      <form
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (name.trim().length < 2) return setError(c.needName);
          let signatureImage: string | null = null;
          if (mode === "drawn") {
            if (!hasInk) return setError(c.needSignature);
            signatureImage = canvasRef.current?.toDataURL("image/png") ?? null;
          } else if (typed.trim().length < 2) {
            return setError(c.needSignature);
          }
          if (!consent) return setError(c.needConsent);
          startTransition(async () => {
            const result = await signMapSiteContractAction({
              fastCode,
              signerName: name,
              signerEmail: email || null,
              signatureType: mode,
              signatureText: mode === "typed" ? typed : null,
              signatureImage,
              consent,
            });
            if ("error" in result) {
              if (result.error === "locked") {
                router.refresh();
                return;
              }
              setError(errorText(result.error));
              return;
            }
            setDone(true);
            window.location.assign(result.redirectTo);
          });
        }}
      >
        <h2 className="text-base font-semibold text-neutral-900">{c.signTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-neutral-700">
            {c.fullName}
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (mode === "typed" && (!typed || typed === name)) setTyped(event.target.value);
              }}
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-neutral-700">
            {c.email}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
        <div className="flex gap-2" role="tablist">
          {(["typed", "drawn"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                mode === value ? "bg-[#035bb8] text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {value === "typed" ? c.typed : c.drawn}
            </button>
          ))}
        </div>
        {mode === "typed" ? (
          <div>
            <input
              aria-label={c.typed}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-2xl italic"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
            />
            <p className="mt-1 text-[11px] text-neutral-500">{c.typedHint}</p>
          </div>
        ) : (
          <div>
            <canvas
              ref={canvasRef}
              width={640}
              height={180}
              aria-label={c.drawn}
              className="h-[140px] w-full touch-none rounded-lg border border-dashed border-neutral-400 bg-white"
              onPointerDown={(event) => {
                const ctx = event.currentTarget.getContext("2d");
                if (!ctx) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                drawing.current = true;
                const p = point(event);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
              }}
              onPointerMove={(event) => {
                if (!drawing.current) return;
                const ctx = event.currentTarget.getContext("2d");
                if (!ctx) return;
                const p = point(event);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                setHasInk(true);
              }}
              onPointerUp={() => {
                drawing.current = false;
              }}
              onPointerLeave={() => {
                drawing.current = false;
              }}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
              <span>{c.drawHint}</span>
              <button type="button" onClick={clearPad} className="font-semibold text-neutral-700">
                {c.clear}
              </button>
            </div>
          </div>
        )}
        <label className="flex items-start gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5"
          />
          <span>{c.consent}</span>
        </label>
        <p className="text-[11px] text-neutral-500">{c.recordNote}</p>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || done}
          className="w-full rounded-lg bg-[#035bb8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {done ? c.signed : pending ? c.signing : c.submit}
        </button>
      </form>
    </section>
  );
}
