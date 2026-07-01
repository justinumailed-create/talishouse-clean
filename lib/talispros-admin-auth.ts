import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const TALISPROS_ADMIN_ACCESS_COOKIE = "talispros_admin_access_token";
const TALISPROS_ADMIN_REFRESH_COOKIE = "talispros_admin_refresh_token";
const TALISPROS_ADMIN_MARKER_COOKIE = "talispros_admin_session";
const TALISPROS_ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

type TalisprosAdminSession = {
  userId: string;
  email: string | null;
};

function getSupabaseAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function writeSessionCookies(session: SupabaseSession) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(TALISPROS_ADMIN_ACCESS_COOKIE, session.access_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: session.expires_in ?? 60 * 60,
  });

  cookieStore.set(TALISPROS_ADMIN_REFRESH_COOKIE, session.refresh_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: TALISPROS_ADMIN_COOKIE_MAX_AGE,
  });

  cookieStore.set(TALISPROS_ADMIN_MARKER_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: TALISPROS_ADMIN_COOKIE_MAX_AGE,
  });
}

export async function clearTalisprosAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TALISPROS_ADMIN_ACCESS_COOKIE);
  cookieStore.delete(TALISPROS_ADMIN_REFRESH_COOKIE);
  cookieStore.delete(TALISPROS_ADMIN_MARKER_COOKIE);
}

export async function signInTalisprosAdminWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: "Enter your email" };
  }
  if (!password) {
    return { success: false, error: "Enter your password" };
  }

  let supabase;
  try {
    supabase = getSupabaseAuthClient();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Supabase auth is not configured",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.session) {
    return { success: false, error: "Invalid email or password" };
  }

  await writeSessionCookies(data.session);
  return { success: true };
}

export async function getTalisprosAdminSession(): Promise<TalisprosAdminSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TALISPROS_ADMIN_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(TALISPROS_ADMIN_REFRESH_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const supabase = getSupabaseAuthClient();

  const { data: userData } = await supabase.auth.getUser(accessToken);
  if (userData.user) {
    return { userId: userData.user.id, email: userData.user.email ?? null };
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshedData.session || !refreshedData.user) {
    await clearTalisprosAdminSession();
    return null;
  }

  await writeSessionCookies(refreshedData.session);
  return {
    userId: refreshedData.user.id,
    email: refreshedData.user.email ?? null,
  };
}

export async function isTalisprosAdminAuthenticated(): Promise<boolean> {
  return (await getTalisprosAdminSession()) !== null;
}

export async function requireTalisprosAdminSession(): Promise<TalisprosAdminSession> {
  const session = await getTalisprosAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireTalisprosAdminPage(): Promise<void> {
  if (!(await isTalisprosAdminAuthenticated())) {
    redirect("/talispros/admin/login");
  }
}
