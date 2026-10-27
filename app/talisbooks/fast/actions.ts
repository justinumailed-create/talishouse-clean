"use server";

import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import {
  establishPaidMapSiteBrowserSession,
  setMapSiteOwnerSession,
} from "@/lib/mapsite-edit-auth";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import {
  connectedBookshelfPath,
  normalizeBookshelfFastCodeInput,
  type OpenConnectedBookshelfResult,
} from "@/lib/talisbooks/bookshelf/lock";

/**
 * "Already have a FAST Code?" on the locked /catalogue/bookshelf shelf.
 * Same FAST Code → Mapsite gate as the home / Mapsites menu entry
 * (openClaimedMapSiteFromHomeFastCode): look the code up, bind the owner
 * session (paid owners get the paid session), then open that code's
 * connected bookshelf. Never lists or hints at other codes.
 */
export async function openConnectedBookshelfFromFastCode(
  rawCode: string,
): Promise<OpenConnectedBookshelfResult> {
  const parsed = normalizeBookshelfFastCodeInput(rawCode);
  if (!parsed.ok) return { success: false, error: parsed.reason };
  const code = parsed.code;

  if (isAllPinsFastCode(code)) {
    return { success: true, href: connectedBookshelfPath(code) };
  }

  // Demonstration codes have no connected bookshelf — same answer as unknown.
  if (isDemoMapSiteCode(code)) return { success: false, error: "notFound" };

  try {
    const mapsite = await getMapSiteByFastCode(code);
    if (!mapsite) return { success: false, error: "notFound" };

    const resolvedCode = (mapsite.fastCode || code).trim().toLowerCase();
    const paid = await hasCompletedMapSiteActivationPayment({
      fastCode: resolvedCode,
      mapsiteId: mapsite.id,
      reconcileFromStripe: true,
    });

    if (paid) {
      await establishPaidMapSiteBrowserSession(resolvedCode);
    } else {
      await setMapSiteOwnerSession(resolvedCode);
    }

    return { success: true, href: connectedBookshelfPath(resolvedCode) };
  } catch (error) {
    console.warn("[bookshelf] openConnectedBookshelfFromFastCode failed:", error);
    return { success: false, error: "failed" };
  }
}
