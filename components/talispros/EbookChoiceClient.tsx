"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EbookChoiceOption } from "@/lib/talispros/ebook-choice";
import {
  buildRahulEbookContinueHref,
  buildSelfEbookContinueHref,
} from "@/lib/talispros/ebook-choice";

const STORAGE_PREFIX = "talispros_ebook_choice:";

function persistChoice(fastCode: string | null, choice: EbookChoiceOption) {
  const key = fastCode?.trim().toLowerCase();
  if (!key || key === "demo") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, choice);
  } catch {
    // Ignore storage failures — navigation still continues.
  }
}

interface EbookChoiceClientProps {
  fastCode: string | null;
  mapsiteId: string | null;
  accountType: string | null;
  requestId: string | null;
}

/**
 * Post–SimpleTexting YES: exactly two E-Book paths. No payment. No registration.
 */
export default function EbookChoiceClient({
  fastCode,
  mapsiteId,
  accountType,
  requestId,
}: EbookChoiceClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState<EbookChoiceOption | null>(null);

  function continueWith(choice: EbookChoiceOption) {
    if (pending) return;
    setPending(choice);
    persistChoice(fastCode, choice);

    if (choice === "self" && !requestId?.trim()) {
      setPending(null);
      window.alert(
        "Build Request ID is missing. Return to the Build Form and complete onboarding again."
      );
      return;
    }

    const href =
      choice === "self"
        ? buildSelfEbookContinueHref({
            requestId,
          })
        : buildRahulEbookContinueHref({
            fastCode,
            mapsiteId,
            accountType,
            requestId,
          });

    router.push(href);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-12 text-neutral-900">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
          TalisBooks™
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Choose how to create your E-Book
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          One choice. Then we continue.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => continueWith("self")}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-900 px-5 py-4 text-base font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {pending === "self" ? "Continuing…" : "Generate My Own E-Book"}
          </button>

          <button
            type="button"
            disabled={pending !== null}
            onClick={() => continueWith("rahul")}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-base font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            {pending === "rahul"
              ? "Continuing…"
              : "Have Rahul Build It For Me"}
          </button>
        </div>
      </div>
    </div>
  );
}
