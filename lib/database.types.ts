export interface Database {
  public: {
    Tables: {
      build_requests: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          account_type: string
          media_focus: string | null
          address: string | null
          geo_location: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          account_type: string
          media_focus?: string | null
          address?: string | null
          geo_location?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          account_type?: string
          media_focus?: string | null
          address?: string | null
          geo_location?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      fast_codes: {
        Row: {
          id: string
          code: string
          type: string
          request_id: string | null
          assigned_at: string
        }
        Insert: {
          id?: string
          code: string
          type: string
          request_id?: string | null
          assigned_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: string
          request_id?: string | null
          assigned_at?: string
        }
        Relationships: []
      }
      mapsite_requests: {
        Row: {
          id: string
          request_id: string
          type: string
          status: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          type: string
          status?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          type?: string
          status?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      mapsite_assets: {
        Row: {
          id: string
          request_id: string
          profile_image: string | null
          logo_image: string | null
          pin_image: string | null
          monologue_pdf: string | null
          ebook_pdf: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          profile_image?: string | null
          logo_image?: string | null
          pin_image?: string | null
          monologue_pdf?: string | null
          ebook_pdf?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          profile_image?: string | null
          logo_image?: string | null
          pin_image?: string | null
          monologue_pdf?: string | null
          ebook_pdf?: string | null
          created_at?: string
        }
        Relationships: []
      }
      production_queue: {
        Row: {
          id: string
          request_id: string
          priority: number
          assigned_to: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          priority?: number
          assigned_to?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          priority?: number
          assigned_to?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          performed_by: string | null
          details: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          performed_by?: string | null
          details?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          performed_by?: string | null
          details?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          email: string | null
          fast_code: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          fast_code?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          fast_code?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
