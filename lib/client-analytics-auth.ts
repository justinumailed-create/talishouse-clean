import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CLIENT_DASHBOARD_PATH,
  CLIENT_LOGIN_PATH,
  MAPSITE_ROOT_ACCOUNT_COOKIE,
  MAPSITE_ROOT_ACCOUNT_MAX_AGE,
} from "./mapsite-account-session";
import { getSupabaseAdmin } from "./supabaseAdmin";

export const CLIENT_ANALYTICS_COOKIE = "client_analytics_session";
export const CLIENT_ANALYTICS_MAX_AGE = 60 * 60 * 24 * 30;

export interface ClientAnalyticsSession {
  fastCode: string;
  email: string;
  displayName: string;
}

async function setMapSiteRootAccountCookie(fastCode: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MAPSITE_ROOT_ACCOUNT_COOKIE, fastCode.trim().toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAPSITE_ROOT_ACCOUNT_MAX_AGE,
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeFastCode(fastCode: string): string {
  return fastCode.trim().toLowerCase();
}

async function validateClientCredentials(
  email: string,
  fastCode: string
): Promise<{ displayName: string } | null> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeFastCode(fastCode);

  const { data: account } = await supabase
    .from("accounts")
    .select("first_name, last_name, email, fast_code")
    .ilike("email", normalizedEmail)
    .ilike("fast_code", normalizedCode)
    .maybeSingle();

  if (account) {
    return {
      displayName: `${account.first_name} ${account.last_name}`.trim(),
    };
  }

  const { data: mapsite } = await supabase
    .from("mapsites")
    .select("owner_first_name, owner_last_name, email, fast_code")
    .ilike("email", normalizedEmail)
    .ilike("fast_code", normalizedCode)
    .maybeSingle();

  if (mapsite) {
    return {
      displayName: `${mapsite.owner_first_name} ${mapsite.owner_last_name}`.trim(),
    };
  }

  return null;
}

export async function signInClientAnalytics(
  email: string,
  fastCode: string
): Promise<{ success: boolean; error?: string; session?: ClientAnalyticsSession }> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeFastCode(fastCode);

  if (!normalizedEmail) {
    return { success: false, error: "Enter your email address." };
  }
  if (!normalizedCode) {
    return { success: false, error: "Enter your FAST Code." };
  }

  const client = await validateClientCredentials(normalizedEmail, normalizedCode);
  if (!client) {
    return { success: false, error: "Invalid email or FAST Code." };
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(CLIENT_ANALYTICS_COOKIE, normalizedCode, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: CLIENT_ANALYTICS_MAX_AGE,
  });

  return {
    success: true,
    session: {
      fastCode: normalizedCode,
      email: normalizedEmail,
      displayName: client.displayName,
    },
  };
}

export async function clearClientAnalyticsSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CLIENT_ANALYTICS_COOKIE);
}

export async function getClientAnalyticsSession(): Promise<ClientAnalyticsSession | null> {
  const cookieStore = await cookies();
  const fastCode = cookieStore.get(CLIENT_ANALYTICS_COOKIE)?.value?.trim().toLowerCase();

  if (!fastCode) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  const { data: account } = await supabase
    .from("accounts")
    .select("first_name, last_name, email, fast_code")
    .ilike("fast_code", fastCode)
    .maybeSingle();

  if (account?.email) {
    return {
      fastCode,
      email: account.email.toLowerCase(),
      displayName: `${account.first_name} ${account.last_name}`.trim(),
    };
  }

  const { data: mapsite } = await supabase
    .from("mapsites")
    .select("owner_first_name, owner_last_name, email, fast_code")
    .ilike("fast_code", fastCode)
    .maybeSingle();

  if (mapsite?.email) {
    return {
      fastCode,
      email: mapsite.email.toLowerCase(),
      displayName: `${mapsite.owner_first_name} ${mapsite.owner_last_name}`.trim(),
    };
  }

  await clearClientAnalyticsSession();
  return null;
}

export async function requireClientAnalyticsSession(): Promise<ClientAnalyticsSession> {
  const session = await getClientAnalyticsSession();
  if (!session) {
    redirect(CLIENT_LOGIN_PATH);
  }
  return session;
}

export async function finalizeRegistrationClientAccess(
  email: string,
  fastCode: string
): Promise<{ redirectUrl: string; sessionEstablished: boolean }> {
  await setMapSiteRootAccountCookie(fastCode);

  const signIn = await signInClientAnalytics(email, fastCode);
  if (signIn.success) {
    return { redirectUrl: CLIENT_DASHBOARD_PATH, sessionEstablished: true };
  }

  return { redirectUrl: CLIENT_DASHBOARD_PATH, sessionEstablished: false };
}
