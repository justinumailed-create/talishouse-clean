import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const client = createClient(supabaseUrl, anonKey)

  const testPayloads = [
    { minimal: true },
    { name: 'Test', phone: '555-0001' },
    { name: 'Test', phone: '555-0002', location: 'NY' },
    { name: 'Test', phone: '555-0003', source: 'web' },
    { name: 'Test', phone: '555-0004', status: 'new' },
    { name: 'Test', phone: '555-0005', deal_status: 'none' },
  ]

  const results = []

  for (const payload of testPayloads) {
    const { data, error } = await client.from('leads').insert([payload]).select()
    
    results.push({
      payload,
      success: !error,
      error: error ? { code: error.code, message: error.message, details: error.details } : null
    })
  }

  return NextResponse.json({
    connection: {
      url: supabaseUrl,
      role: 'anon'
    },
    results
  })
}
