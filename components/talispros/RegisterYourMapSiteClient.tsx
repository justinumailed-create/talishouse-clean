"use client";

import { useState } from "react";
import { MAPSITE_URL_GATE_HEADLINE } from "@/lib/talispros/mapsite-url-gate";
import { submitMapSiteUrlGatePin } from "@/lib/talispros/mapsite-url-gate-actions";

export default function RegisterYourMapSiteClient({
  fastCode,
  pinIssued,
}: {
  fastCode: string;
  pinIssued: boolean;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await submitMapSiteUrlGatePin(fastCode, formData);
    setPending(false);
    if (result && !result.success) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-neutral-900">
          {MAPSITE_URL_GATE_HEADLINE}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
          Enter the 6-digit PIN issued by Global Admin to continue to the listing
          URL submitted for this Mapsite™.
        </p>

        {!pinIssued ? (
          <p className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-600">
            Global Admin has not authorized a PIN for this Mapsite™ yet.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                6-digit PIN
              </span>
              <input
                name="pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-center font-mono text-xl tracking-[0.4em] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                placeholder="••••••"
                required
              />
            </label>
            <button
              type="submit"
              disabled={pending || pin.length !== 6}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {pending ? "Checking…" : "Continue to listing URL"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
