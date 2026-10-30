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
import { personalHomePath } from "@/lib/talispros/personal-home";

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

  if (!isIssuedFastCode(result.fastCode)) {
    revalidatePath(MAPSITE_APP_PATH);
    revalidatePath(pathnameForRevalidate(result.href));
    return result;
  }

  await setMapSiteOwnerSession(result.fastCode);

  revalidatePath(MAPSITE_APP_PATH);
  revalidatePath(pathnameForRevalidate(result.href));
  if (result.tebHref) {
    revalidatePath(pathnameForRevalidate(result.tebHref));
  }

  // New root account holders open their personal home page first; its
  // Home / Mapsite navbar leads to the claimed Mapsite (result.href).
  const homeHref = personalHomePath(result.fastCode);
  revalidatePath(homeHref);
  return { ...result, href: homeHref };
}
