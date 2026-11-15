import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Newer @supabase/supabase-js throws if url/key are empty. Use a syntactically
 * valid placeholder during `next build` when env is not injected (CI/local).
 * Production always has NEXT_PUBLIC_SUPABASE_*.
 */
const clientUrl = supabaseUrl || "https://placeholder.supabase.co";
const clientKey = supabaseAnonKey || "public-anon-key";

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** Service role when it is configured, otherwise the public key for tables anon may read. */
export function getSupabaseReadClient(): SupabaseClient | null {
  if (isSupabaseAdminConfigured()) {
    return getSupabaseAdmin() as unknown as SupabaseClient;
  }
  if (!isSupabaseConfigured) return null;
  return supabase;
}
