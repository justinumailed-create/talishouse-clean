"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DemoFastCodePreview from "@/components/talispros/DemoFastCodePreview";
import { claimDemoMapSiteAction } from "@/app/talispros/demo-mapsite/claim-actions";
import { splitPersonName } from "@/validators/fast-code.validator";
import { TALISPROS_START_SEGMENTS } from "@/lib/talispros/start-content";
import { parseRegistrationMarket } from "@/lib/registration-market";
import { accountTypeForAudience } from "@/lib/talispros/account-capabilities";

type DemoClaimMarketButtonProps = {
  mapsiteId: string;
  /** Prefill from Mapsite™ owner / agent when it looks like a real name. */
  suggestedFullName?: string | null;
  className?: string;
  align?: "start" | "center";
};

function suggestedNames(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const raw = fullName?.trim() || "";
  if (!raw) return { firstName: "", lastName: "" };
  // Ignore placeholder demo labels.
  if (/^demo(\s|$)/i.test(raw) || /mapsite/i.test(raw)) {
    return { firstName: "", lastName: "" };
  }
  try {
    const { firstName, lastName } = splitPersonName(raw);
    return { firstName: firstName || "", lastName: lastName || "" };
  } catch {
    return { firstName: "", lastName: "" };
  }
}

function audienceFromSegmentHref(href: string): string {
  try {
    const url = new URL(href, "https://talispros.local");
    const audience = parseRegistrationMarket(url.searchParams.get("audience"));
    if (audience) return audience;
    const accountType = url.searchParams.get("accountType");
    if (accountType) return accountType;
  } catch {
    /* ignore */
  }
  return "brokers";
}

/**
 * In-place Claim Your Market™ on a demonstration Mapsite™:
 * choose /start audience → collect name → issue FAST Code™ → open live claimed URL.
 */
export default function DemoClaimMarketButton({
  mapsiteId,
  suggestedFullName,
  className = "",
  align = "start",
}: DemoClaimMarketButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const seed = suggestedNames(suggestedFullName);
  const [firstName, setFirstName] = useState(seed.firstName);
  const [lastName, setLastName] = useState(seed.lastName);
  const [audienceKey, setAudienceKey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    if (!audienceKey) {
      setError("Choose who you are (same options as /start) before claiming.");
      return;
    }
    const market = parseRegistrationMarket(audienceKey) ?? "brokers";
    const accountType = accountTypeForAudience(market);
    startTransition(async () => {
      const result = await claimDemoMapSiteAction({
        mapsiteId,
        firstName,
        lastName,
        accountType,
        audience: market,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.href);
    });
  }

  const justify = align === "center" ? "justify-center" : "justify-start";

  return (
    <div className={`flex flex-col ${justify} ${className}`}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Claim Your Market™
        </button>
      ) : (
        <div className="w-full max-w-[280px] space-y-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Claim Your Market™
          </p>
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-medium text-neutral-500">
              What best describes you?
            </legend>
            {TALISPROS_START_SEGMENTS.map((segment) => {
              const key = audienceFromSegmentHref(segment.href);
              const selected = audienceKey === key;
              return (
                <label
                  key={segment.label}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition ${
                    selected
                      ? "border-[#046BD9] bg-[#046BD9]/5"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="claim-audience"
                    value={key}
                    checked={selected}
                    disabled={pending}
                    onChange={() => setAudienceKey(key)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                      {segment.label}
                    </span>
                    <span className="block text-[13px] font-medium leading-snug text-neutral-900">
                      {segment.title}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <label className="block">
            <span className="text-[11px] font-medium text-neutral-500">
              First name
            </span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={pending}
              autoComplete="given-name"
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
              placeholder="First name"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-neutral-500">
              Last name
            </span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={pending}
              autoComplete="family-name"
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50"
              placeholder="Last name"
            />
          </label>
          <DemoFastCodePreview firstName={firstName} lastName={lastName} />
          {error ? (
            <p className="text-xs leading-relaxed text-red-600">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                pending ||
                !firstName.trim() ||
                !lastName.trim() ||
                !audienceKey
              }
              onClick={handleClaim}
              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-[#046BD9] px-3 text-sm font-medium text-white transition hover:bg-[#0357b0] disabled:opacity-50"
            >
              {pending ? "Claiming…" : "Claim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
