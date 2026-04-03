import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
  }

  const adminClient = createClient(supabaseUrl!, serviceKey, {
    auth: { persistSession: false }
  })

  const { data, error } = await adminClient
    .from('leads')
    .insert([{ 
      name: 'RLS Test', 
      phone: '555-TEST', 
      location: 'test',
      source: 'api-test',
      status: 'new',
      deal_status: 'none'
    }])
    .select()
  
  if (error) {
    return NextResponse.json({
      success: false,
      message: 'Service key insert failed - RLS needs manual fix',
      error: { code: error.code, message: error.message },
      sqlToRun: `
-- Run this in Supabase SQL Editor (Settings > SQL Editor)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert" ON leads;
DROP POLICY IF EXISTS "Allow anon read" ON leads;
DROP POLICY IF EXISTS "Allow all for authenticated" ON leads;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon read" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "Allow all for authenticated" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
      `.trim()
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Service key works! Insert succeeded',
    data
  })
}
