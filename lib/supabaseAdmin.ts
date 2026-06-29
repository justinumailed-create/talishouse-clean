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
