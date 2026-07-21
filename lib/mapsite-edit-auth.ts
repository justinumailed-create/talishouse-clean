import { cookies } from "next/headers";
import { isAdminAuthenticated } from "./admin-auth";
import {
  MAPSITE_OWNER_COOKIE,
  MAPSITE_ROOT_ACCOUNT_COOKIE,
} from "./mapsite-account-session";
import { isMarketingManagerAuthenticated } from "./marketing-manager-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";

export async function getMapSiteOwnerSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MAPSITE_OWNER_COOKIE)?.value?.trim().toLowerCase() ?? null;
}

export async function getRegisteredMapSiteFastCode(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(MAPSITE_ROOT_ACCOUNT_COOKIE)?.value?.trim().toLowerCase() ??
    null
  );
}

function normalizeFastCode(fastCode: string): string {
  return fastCode.trim().toLowerCase();
}

async function isMapSiteAdmin(): Promise<boolean> {
  return (
    (await isAdminAuthenticated()) ||
    (await isTalisprosAdminAuthenticated()) ||
    (await isMarketingManagerAuthenticated())
  );
}

export async function canEditMapSite(fastCode: string): Promise<boolean> {
  return isMapSiteAdmin();
}

export async function requireMapSiteEditAccess(fastCode: string): Promise<void> {
  if (!(await canEditMapSite(fastCode))) {
    throw new Error("Unauthorized");
  }
}

export async function setMapSiteOwnerSession(fastCode: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MAPSITE_OWNER_COOKIE, fastCode.trim().toLowerCase(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}

export interface MapSiteEditToolbarState {
  isAdmin: boolean;
  isOwner: boolean;
  showToolbar: boolean;
}

export async function getMapSiteEditToolbarState(
  fastCode: string
): Promise<MapSiteEditToolbarState> {
  const isAdmin = await isMapSiteAdmin();
  const ownerSession = await getMapSiteOwnerSession();
  const registeredFastCode = await getRegisteredMapSiteFastCode();
  const target = normalizeFastCode(fastCode);

  const hasOwnerSession = ownerSession === target;
  const isRegisteredOwner =
    registeredFastCode !== null && registeredFastCode === target;

  return {
    isAdmin,
    isOwner: hasOwnerSession || isRegisteredOwner,
    showToolbar: isAdmin || hasOwnerSession || isRegisteredOwner,
  };
}
