"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  handleSamCartStartReturn,
  type SamCartStartReturnResult,
} from "@/app/talispros/start/samcart-return-actions";
import { isSamCartPaymentReturn, parseSamCartReturnParams } from "@/lib/talispros/samcart-return";

/**
 * On /start after SamCart Custom URL redirect: detect orderid/email,
 * set paid/session state (unverified without webhook), and surface status.
 */
export default function TalisprosSamCartReturnBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);
  const [result, setResult] = useState<SamCartStartReturnResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    const parsed = parseSamCartReturnParams(raw);
    if (!isSamCartPaymentReturn(parsed)) return;

    ran.current = true;
    setBusy(true);
    void handleSamCartStartReturn(raw)
      .then((next) => {
        setResult(next);
        if (next.href && next.sessionEstablished) {
          // Stay on /start with success UI; user can Login or follow link.
        }
      })
      .catch(() => {
        setResult({
          detected: true,
          chargeVerified: false,
          verificationNote:
            "Return detected but session setup failed. Use Login with your FAST Code™.",
          orderId: parsed.orderId,
          email: parsed.email,
          fastCode: parsed.fastCode,
          mapsiteId: null,
          href: null,
          paymentRecorded: false,
          sessionEstablished: false,
          error: "Session setup failed.",
        });
      })
      .finally(() => setBusy(false));
  }, [searchParams, router]);

  if (!busy && !result?.detected) return null;

  return (
    <div
      className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-950 sm:px-10 lg:px-12"
      role="status"
      aria-live="polite"
    >
      {busy && !result ? (
        <p className="font-medium">Confirming payment return…</p>
      ) : result ? (
        <div className="space-y-1.5">
          <p className="font-semibold tracking-wide">
            {result.sessionEstablished || result.paymentRecorded
              ? "Payment return received — Mapsite™ unlock in progress."
              : "Payment return detected."}
          </p>
          {result.orderId ? (
            <p className="text-xs text-emerald-800">
              SamCart order <span className="font-mono">{result.orderId}</span>
              {result.fastCode ? (
                <>
                  {" "}
                  · FAST Code™{" "}
                  <span className="font-mono uppercase">{result.fastCode}</span>
                </>
              ) : null}
            </p>
          ) : null}
          <p className="text-xs leading-snug text-emerald-800/90">
            {result.verificationNote}
          </p>
          {result.href ? (
            <a
              href={result.href}
              className="inline-block pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-950 underline-offset-2 hover:underline"
            >
              Open your claimed Mapsite™
            </a>
          ) : (
            <p className="text-xs text-emerald-800">
              Use <strong>Login To Your Account</strong> with your FAST Code™ to
              open your Mapsite™.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
