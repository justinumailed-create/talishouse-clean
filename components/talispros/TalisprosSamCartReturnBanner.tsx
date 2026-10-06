"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  handleSamCartStartReturn,
  type SamCartStartReturnResult,
} from "@/app/talispros/start/samcart-return-actions";
import { isSamCartPaymentReturn, parseSamCartReturnParams } from "@/lib/talispros/samcart-return";
import { useT } from "@/lib/i18n/client";

/**
 * On `/` after SamCart Custom URL redirect: detect orderid/email,
 * set paid/session state (unverified without webhook), and surface status.
 */
export default function TalisprosSamCartReturnBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);
  const t = useT();
  const r = t.home.samcartReturn;
  const failedNote = r.failedNote;
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
          // Stay on `/` with success UI; user can Login or follow link.
        }
      })
      .catch(() => {
        setResult({
          detected: true,
          chargeVerified: false,
          verificationNote: failedNote,
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
  }, [searchParams, router, failedNote]);

  if (!busy && !result?.detected) return null;

  return (
    <div
      className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-950 sm:px-10 lg:px-12"
      role="status"
      aria-live="polite"
    >
      {busy && !result ? (
        <p className="font-medium">{r.confirming}</p>
      ) : result ? (
        <div className="space-y-1.5">
          <p className="font-semibold tracking-wide">
            {result.sessionEstablished || result.paymentRecorded
              ? r.received
              : r.detected}
          </p>
          {result.orderId ? (
            <p className="text-xs text-emerald-800">
              {r.order} <span className="font-mono">{result.orderId}</span>
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
              {r.openClaimed}
            </a>
          ) : (
            <p className="text-xs text-emerald-800">
              {r.useAccountBefore} <strong>{t.home.openAccount}</strong>{" "}
              {r.useAccountAfter}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
