import { cookies } from "next/headers";
import { isAdminAuthenticated } from "./admin-auth";
import {
  MAPSITE_OWNER_COOKIE,
  MAPSITE_OWNER_MAX_AGE,
} from "./mapsite-account-session";

export async function getMapSiteOwnerSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MAPSITE_OWNER_COOKIE)?.value?.trim().toLowerCase() ?? null;
}

export async function canEditMapSite(fastCode: string): Promise<boolean> {
  if (await isAdminAuthenticated()) {
    return true;
  }

  const ownerCode = await getMapSiteOwnerSession();
  return ownerCode === fastCode.trim().toLowerCase();
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
    maxAge: MAPSITE_OWNER_MAX_AGE,
    sameSite: "lax",
  });
}

export interface MapSiteEditToolbarState {
  isAdmin: boolean;
  isOwner: boolean;
}

export async function getMapSiteEditToolbarState(
  fastCode: string
): Promise<MapSiteEditToolbarState> {
  const isAdmin = await isAdminAuthenticated();
  const ownerSession = await getMapSiteOwnerSession();

  return {
    isAdmin,
    isOwner: ownerSession === fastCode.trim().toLowerCase(),
  };
}
