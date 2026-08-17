"use client";

import Link from "next/link";
import { buildRegisterAgentUnderRootHref } from "@/lib/talispros/register-agents";
import {
  buildClaimedMapSitePath,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";

interface RegisterAgentsClientProps {
  fastCode: string | null;
  mapsiteId: string | null;
  audience: string | null;
}

export default function RegisterAgentsClient({
  fastCode,
  mapsiteId,
  audience,
}: RegisterAgentsClientProps) {
  const registerHref = buildRegisterAgentUnderRootHref(fastCode);
  const mapsiteHref = fastCode
    ? buildClaimedMapSitePath({
        fastCode,
        audience: audience || undefined,
      })
    : mapsiteId
      ? `${MAPSITE_APP_PATH}?claimed=1&view=pin&mapsiteId=${encodeURIComponent(mapsiteId)}${
          audience ? `&audience=${encodeURIComponent(audience)}` : ""
        }`
      : MAPSITE_APP_PATH;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-neutral-900">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
          Talispros™
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
          REGISTER YOUR AGENTS
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-500 sm:text-base">
          Payment confirmed. Invite licensed professionals under your Root
          Account™ as Derivative Accounts™ so they can advertise, qualify for
          SPLITS, and operate on your market.
        </p>

        {fastCode ? (
          <p className="mt-6 font-mono text-sm font-medium text-neutral-800">
            Your FAST Code™ · {fastCode.toUpperCase()}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href={registerHref}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-5 py-4 text-base font-medium text-white transition hover:bg-neutral-800"
          >
            Register an agent
          </Link>
          <Link
            href={mapsiteHref}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-base font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Open my Mapsite™
          </Link>
        </div>
      </div>
    </div>
  );
}
