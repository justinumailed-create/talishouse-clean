import { cookies } from "next/headers";
import { isAdminAuthenticated } from "./admin-auth";
import {
  MAPSITE_OWNER_COOKIE,
  MAPSITE_OWNER_MAX_AGE,
  MAPSITE_ROOT_ACCOUNT_COOKIE,
  MAPSITE_ROOT_ACCOUNT_MAX_AGE,
} from "./mapsite-account-session";
import { isMarketingManagerAuthenticated } from "./marketing-manager-auth";
import { isTalisprosAdminAuthenticated } from "./talispros-admin-auth";
import { hasCompletedMapSitePaypalPayment } from "./talispros/mapsite-payment";

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
  if (await isMapSiteAdmin()) return true;
  const state = await getMapSiteEditToolbarState(fastCode);
  if (!state.isOwner) return false;
  return hasCompletedMapSitePaypalPayment({ fastCode });
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

/**
 * After a successful activation payment, bind this browser to the Mapsite™
 * owner session. Stripe webhooks cannot set the customer's cookies; checkout
 * return (server action) can. Safe to call from RSC — failures are ignored.
 */
export async function establishPaidMapSiteBrowserSession(
  fastCode: string,
): Promise<void> {
  const code = fastCode.trim().toLowerCase();
  if (!code) return;
  try {
    const cookieStore = await cookies();
    cookieStore.set(MAPSITE_OWNER_COOKIE, code, {
      path: "/",
      maxAge: MAPSITE_OWNER_MAX_AGE,
      sameSite: "lax",
    });
    cookieStore.set(MAPSITE_ROOT_ACCOUNT_COOKIE, code, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAPSITE_ROOT_ACCOUNT_MAX_AGE,
    });
  } catch (error) {
    console.warn(
      "[mapsite-edit-auth] Could not set owner cookies from this request:",
      error,
    );
  }
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

/** True when the current browser session belongs to this Mapsite™ owner. */
export async function isOwnMapSite(fastCode: string | null | undefined): Promise<boolean> {
  const code = fastCode?.trim();
  if (!code) return false;
  const state = await getMapSiteEditToolbarState(code);
  return state.isOwner;
}
