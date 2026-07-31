"use server";

import { setMapSiteOwnerSession } from "@/lib/mapsite-edit-auth";
import type { PostBuildSuccessPath } from "@/lib/talispros/ebook-choice";
import { ensureClientMapSiteFromBuildRequest } from "@/lib/talispros/ensure-client-mapsite";

export async function openMapSiteAfterBuildRequest(input: {
  requestId: string;
  fastCode?: string | null;
  accountType?: string | null;
  /** self-ebook | rahul-waiting | mapsite (default) */
  successPath?: PostBuildSuccessPath;
}): Promise<{ href: string; mapsiteId?: string; fastCode?: string | null }> {
  const result = await ensureClientMapSiteFromBuildRequest({
    requestId: input.requestId,
    fastCode: input.fastCode,
    accountType: input.accountType,
    successPath: input.successPath,
  });

  const fastCode = result.ok
    ? result.fastCode
    : input.fastCode?.trim() || null;

  // Mark this browser as the MapSite™ owner so auto-open pin/flag applies.
  if (fastCode && fastCode.toLowerCase() !== "demo") {
    await setMapSiteOwnerSession(fastCode);
  }

  return {
    href: result.href,
    mapsiteId: result.ok ? result.mapsiteId : undefined,
    fastCode,
  };
}

/** Establish owner session after Build My MapSite™ (or other success handoff). */
export async function establishOwnerMapSiteSession(
  fastCode: string | null | undefined
): Promise<void> {
  const code = fastCode?.trim();
  if (!code || code.toLowerCase() === "demo") return;
  await setMapSiteOwnerSession(code);
}
