import { createClient } from '@supabase/supabase-js'

let cachedClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
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

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}
