"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import {
  buildClaimedMapSitePath,
  buildClaimRegistrationHref,
  toShareableAbsoluteUrl,
} from "@/lib/talispros/mapsite-state";

interface MapSiteAdminShareLinksProps {
  mapsiteId: string;
  fastCode: string;
  audience?: string | null;
  accountType?: string | null;
  /** True when talispros_payments has a completed PayPal note for this claim. */
  paymentReceived?: boolean;
}

function ShareLinkRow({
  label,
  description,
  path,
  origin,
  disabled = false,
  disabledReason,
}: {
  label: string;
  description: string;
  path: string;
  origin: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [copied, setCopied] = useState(false);
  const absolute = toShareableAbsoluteUrl(path, origin || null);

  async function copy() {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy link", absolute);
    }
  }

  return (
    <div className={`px-5 py-4 sm:px-6 ${disabled ? "opacity-50" : ""}`}>
      <p className="m-0 text-[15px] font-semibold tracking-tight text-neutral-900">
        {label}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-neutral-500">
        {description}
      </p>
      {disabled && disabledReason ? (
        <p className="mt-1.5 text-[12px] font-medium text-neutral-400">
          {disabledReason}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p
          className={`m-0 min-w-0 flex-1 truncate rounded-full bg-white px-3.5 py-2 text-[12px] tracking-tight text-neutral-500 ring-1 ring-black/[0.04] ${
            disabled ? "line-through" : ""
          }`}
          title={absolute}
        >
          {absolute}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          {disabled ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-400 ring-1 ring-black/[0.06]">
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          ) : (
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-900 ring-1 ring-black/[0.06] transition hover:bg-neutral-50"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Admin share links for registration:
 * 1) Claim invite (pre-claim / start registration)
 * 2) Post-claim success Mapsite™ (pre-SPLITS) — greyed out after payment success
 */
export default function MapSiteAdminShareLinks({
  mapsiteId,
  fastCode,
  audience,
  accountType,
  paymentReceived = false,
}: MapSiteAdminShareLinksProps) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const claimRegistrationPath = buildClaimRegistrationHref({
    mapsiteId,
    audience,
    accountType,
  });
  const postClaimPath = buildClaimedMapSitePath({
    fastCode,
    audience,
    accountType,
  });

  return (
    <section className="rounded-[22px] bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:p-8">
      <p className="m-0 text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
        Share
      </p>
      <h2 className="mt-1 text-[21px] font-semibold tracking-tight text-neutral-900">
        Share registration links
      </h2>
      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-neutral-500">
        Copy links to send for Claim a Market™ registration and for post-claim
        SPLITS checkout on the Mapsite™.
      </p>

      <div className="mt-6 divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-[#f5f5f7] ring-1 ring-black/[0.04]">
        <ShareLinkRow
          label="Claim registration (pre-claim)"
          description="Share so a prospect can open Claim a Market™ and register against this Mapsite™ pin."
          path={claimRegistrationPath}
          origin={origin}
        />

        <ShareLinkRow
          label="Post-claim success (pre SPLITS)"
          description="Share after claim succeeds. Opens the short Mapsite™ URL with SPLITS checkout until payment is received."
          path={postClaimPath}
          origin={origin}
          disabled={paymentReceived}
          disabledReason={
            paymentReceived
              ? "Payment success is on file — pre-SPLITS link is no longer active."
              : undefined
          }
        />
      </div>
    </section>
  );
}
