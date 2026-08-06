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
    <div
      className={`rounded-xl border px-4 py-3 ${
        disabled
          ? "border-neutral-200 bg-neutral-100/90 opacity-60"
          : "border-neutral-200 bg-neutral-50/80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${
              disabled ? "text-neutral-500" : "text-neutral-900"
            }`}
          >
            {label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
            {description}
          </p>
          {disabled && disabledReason ? (
            <p className="mt-1 text-xs font-medium text-neutral-500">
              {disabledReason}
            </p>
          ) : null}
          <p
            className={`mt-2 break-all font-mono text-[12px] ${
              disabled ? "text-neutral-400 line-through" : "text-neutral-700"
            }`}
          >
            {absolute}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          {disabled ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm font-medium text-neutral-400">
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          ) : (
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
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
 * 2) Post-claim success Mapsite™ (pre-PayPal) — greyed out after payment success
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Share registration links
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Copy links to send for Claim a Market™ registration and for post-claim
          PayPal checkout on the Mapsite™.
        </p>
      </div>

      <ShareLinkRow
        label="Claim registration (pre-claim)"
        description="Share so a prospect can open Claim a Market™ and register against this Mapsite™ pin."
        path={claimRegistrationPath}
        origin={origin}
      />

      <ShareLinkRow
        label="Post-claim success (pre-PayPal)"
        description="Share after claim succeeds. Opens the short Mapsite™ URL with PayPal checkout until payment is received."
        path={postClaimPath}
        origin={origin}
        disabled={paymentReceived}
        disabledReason={
          paymentReceived
            ? "PayPal payment success is on file — pre-PayPal link is no longer active."
            : undefined
        }
      />
    </section>
  );
}
