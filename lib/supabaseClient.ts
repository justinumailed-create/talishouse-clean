import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const runtime = typeof window === 'undefined' ? 'server' : 'browser'

console.log("[supabaseClient] RUNTIME:", runtime)
console.log("[supabaseClient] NODE_VERSION:", typeof process !== 'undefined' ? process.version : 'N/A')
console.log("[supabaseClient] URL:", supabaseUrl)
console.log("[supabaseClient] URL length:", supabaseUrl.length)
console.log("[supabaseClient] URL chars:", supabaseUrl.split('').map(c => c.charCodeAt(0)))
console.log("[supabaseClient] KEY present:", !!supabaseAnonKey)
console.log("[supabaseClient] KEY length:", supabaseAnonKey.length)
console.log("[supabaseClient] KEY start:", supabaseAnonKey.substring(0, 20))
console.log("[supabaseClient] KEY chars start:", supabaseAnonKey.substring(0, 10).split('').map(c => c.charCodeAt(0)))

if (!supabaseUrl) {
  throw new Error(
    '[supabaseClient] FATAL: NEXT_PUBLIC_SUPABASE_URL is empty. ' +
    'Check .env.local / .env files. Runtime: ' + runtime
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '[supabaseClient] FATAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is empty. ' +
    'Check .env.local / .env files. Runtime: ' + runtime
  )
}

const customFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  console.log("[supabaseClient] FETCH:", url)
  try {
    const response = await fetch(input, init)
    console.log("[supabaseClient] RESPONSE status:", response.status, "url:", url)
    return response
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const errCause = err instanceof Error && (err as any).cause
      ? (err as any).cause instanceof Error
        ? (err as any).cause.message
        : JSON.stringify((err as any).cause)
      : 'no cause'
    console.error("[supabaseClient] FETCH FAILED for URL:", url)
    console.error("[supabaseClient] FETCH ERROR:", errMsg)
    console.error("[supabaseClient] FETCH CAUSE:", errCause)
    console.error("[supabaseClient] FETCH STACK:", err instanceof Error ? err.stack : 'no stack')
    throw err
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: customFetch,
  },
})

export const isSupabaseConfigured = true
