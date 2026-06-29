import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let cachedClient: SupabaseClient<Database> | null = null
let adminClientDisabled = false

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function getMapSiteAdminWritesState(): {
  enabled: boolean;
  message: string | null;
} {
  if (isSupabaseAdminConfigured()) {
    return { enabled: true, message: null };
  }

  if (process.env.VERCEL) {
    return {
      enabled: false,
      message:
        "Read-only mode: add SUPABASE_SERVICE_ROLE_KEY in the Vercel project settings (Production, Preview, and Development), then redeploy.",
    };
  }

  return {
    enabled: false,
    message:
      "Read-only mode: add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server to save changes.",
  };
}

export function disableSupabaseAdminClient(): void {
  adminClientDisabled = true
  cachedClient = null
}

export function tryGetSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!isSupabaseAdminConfigured() || adminClientDisabled) {
    return null
  }

  return getSupabaseAdmin()
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Supabase environment variables missing: ${
        !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''
      }${!supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`
    )
  }

  cachedClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}
