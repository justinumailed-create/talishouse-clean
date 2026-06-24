import type { Database } from './lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Replicate the GenericSchema from supabase-js
type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type GenericTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: GenericRelationship[]
}

type GenericView = 
  | { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: GenericRelationship[] }
  | { Row: Record<string, unknown>; Relationships: GenericRelationship[] }

type GenericFunction = {
  Args: Record<string, unknown> | never
  Returns: unknown
}

type GenericSchema = {
  Tables: Record<string, GenericTable>
  Views: Record<string, GenericView>
  Functions: Record<string, GenericFunction>
}

// Test 1: Does Database['public'] extend GenericSchema?
type Check1 = Database['public'] extends GenericSchema ? true : false

// Test 2: What resolved Schema does SupabaseClient infer?
type ClientSchema = SupabaseClient<Database> extends SupabaseClient<infer D, infer S, infer SN, infer SC> ? SC : never

// Test 3: What does Schema['Tables'] look like?
type ResolvedSchema = Database['public'] extends GenericSchema ? Database['public'] : never
type SchemaTables = ResolvedSchema['Tables']

// Test 4: What type does from("build_requests") produce?
type Tables = ResolvedSchema['Tables']
type BuildReqTable = Tables extends Record<string, infer T> ? T : never
type BuildReqInsert = BuildReqTable extends { Insert: infer I } ? I : never

// Export to suppress errors
export type { Check1, ClientSchema, SchemaTables, BuildReqInsert }
