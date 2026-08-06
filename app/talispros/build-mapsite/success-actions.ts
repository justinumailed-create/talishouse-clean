"use server";

import { setMapSiteOwnerSession } from "@/lib/mapsite-edit-auth";
import type { PostBuildSuccessPath } from "@/lib/talispros/ebook-choice";
import { ensureClientMapSiteFromBuildRequest } from "@/lib/talispros/ensure-client-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import {
  logOnboardingStep,
  onboardingNow,
  timedOnboardingStep,
} from "@/lib/onboarding-timing";

export async function openMapSiteAfterBuildRequest(input: {
  requestId: string;
  fastCode?: string | null;
  accountType?: string | null;
  /** self-ebook | rahul-waiting | mapsite (default) */
  successPath?: PostBuildSuccessPath;
}): Promise<{ href: string; mapsiteId?: string; fastCode?: string | null }> {
  const started = onboardingNow();
  const result = await timedOnboardingStep(
    "Mapsite™ creation",
    () =>
      ensureClientMapSiteFromBuildRequest({
        requestId: input.requestId,
        fastCode: input.fastCode,
        accountType: input.accountType,
        successPath: input.successPath,
      }),
    { requestId: input.requestId, successPath: input.successPath ?? "mapsite" }
  );

  const fastCode = result.ok
    ? result.fastCode
    : input.fastCode?.trim() || null;

  const successPath = input.successPath ?? "mapsite";
  if (successPath === "self-ebook" && !isIssuedFastCode(fastCode)) {
    logOnboardingStep("Redirect blocked", started, {
      reason: "missing_issued_fast_code",
      fastCode,
      requestId: input.requestId,
    });
    throw new Error(
      "FAST Code was not issued before redirect to the E-Book generator. Please resubmit the Build Form."
    );
  }

  // Mark this browser as the Mapsite™ owner so auto-open pin/flag applies.
  if (isIssuedFastCode(fastCode)) {
    const cookieStarted = onboardingNow();
    await setMapSiteOwnerSession(fastCode);
    logOnboardingStep("Owner session", cookieStarted, { fastCode });
  }

  logOnboardingStep("Redirect", started, {
    href: result.href,
    fastCode,
    mapsiteId: result.ok ? result.mapsiteId : undefined,
  });

  return {
    href: result.href,
    mapsiteId: result.ok ? result.mapsiteId : undefined,
    fastCode,
  };
}

/** Establish owner session after Build My Mapsite™ (or other success handoff). */
export async function establishOwnerMapSiteSession(
  fastCode: string | null | undefined
): Promise<void> {
  const code = fastCode?.trim();
  if (!code || code.toLowerCase() === "demo" || !isIssuedFastCode(code)) return;
  const started = onboardingNow();
  await setMapSiteOwnerSession(code);
  logOnboardingStep("Owner session", started, { fastCode: code });
}
