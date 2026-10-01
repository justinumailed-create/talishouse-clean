"use server";

import { revalidatePath } from "next/cache";
import { setMapSiteOwnerSession } from "@/lib/mapsite-edit-auth";
import {
  claimDemoMapSite,
  type ClaimDemoMapSiteResult,
} from "@/lib/talispros/claim-demo-mapsite";
import { pathnameForRevalidate } from "@/lib/talispros/demo-mapsite";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export type ClaimDemoMapSiteActionResult = ClaimDemoMapSiteResult;

export async function claimDemoMapSiteAction(input: {
  mapsiteId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email?: string | null;
  accountType?: string | null;
  /** /start audience (brokers | listings | fsbos | adpro). */
  audience?: string | null;
}): Promise<ClaimDemoMapSiteActionResult> {
  const result = await claimDemoMapSite(input);
  if (!result.ok) return result;

  if (isIssuedFastCode(result.fastCode)) {
    await setMapSiteOwnerSession(result.fastCode);
  }

  revalidatePath(MAPSITE_APP_PATH);
  revalidatePath(pathnameForRevalidate(result.href));
  if (result.tebHref) {
    revalidatePath(pathnameForRevalidate(result.tebHref));
  }

  return result;
}
