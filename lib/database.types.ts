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
          street_address: string | null
          latitude: number | null
          longitude: number | null
          pin_writeup: string | null
          future_pin_color: string | null
          future_pin_icon: string | null
          future_pin_border: string | null
          future_pin_label: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          company: string | null
          market_type: string | null
          property_title: string | null
          logo: string | null
          gallery_images: string[]
          video: string | null
          description: string | null
          requested_account_type: string | null
          requested_fast_code: string | null
          assigned_marketing_manager: string | null
          notes: string | null
          approval_status: string | null
          approved_at: string | null
          activated_at: string | null
          linked_account_id: string | null
          linked_mapsite_id: string | null
          registration_link: string | null
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
          street_address?: string | null
          latitude?: number | null
          longitude?: number | null
          pin_writeup?: string | null
          future_pin_color?: string | null
          future_pin_icon?: string | null
          future_pin_border?: string | null
          future_pin_label?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          company?: string | null
          market_type?: string | null
          property_title?: string | null
          logo?: string | null
          gallery_images?: string[]
          video?: string | null
          description?: string | null
          requested_account_type?: string | null
          requested_fast_code?: string | null
          assigned_marketing_manager?: string | null
          notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          activated_at?: string | null
          linked_account_id?: string | null
          linked_mapsite_id?: string | null
          registration_link?: string | null
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
          street_address?: string | null
          latitude?: number | null
          longitude?: number | null
          pin_writeup?: string | null
          future_pin_color?: string | null
          future_pin_icon?: string | null
          future_pin_border?: string | null
          future_pin_label?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          company?: string | null
          market_type?: string | null
          property_title?: string | null
          logo?: string | null
          gallery_images?: string[]
          video?: string | null
          description?: string | null
          requested_account_type?: string | null
          requested_fast_code?: string | null
          assigned_marketing_manager?: string | null
          notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          activated_at?: string | null
          linked_account_id?: string | null
          linked_mapsite_id?: string | null
          registration_link?: string | null
          created_at?: string
        }
        Relationships: []
      }
      build_request_registrations: {
        Row: {
          id: string
          build_request_id: string
          registration_link: string
          status: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          build_request_id: string
          registration_link: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          build_request_id?: string
          registration_link?: string
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      fast_codes: {
        Row: {
          id: string
          code: string
          type: string
          request_id: string | null
          account_type: string | null
          mapsite_id: string | null
          assigned_at: string
        }
        Insert: {
          id?: string
          code: string
          type: string
          request_id?: string | null
          account_type?: string | null
          mapsite_id?: string | null
          assigned_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: string
          request_id?: string | null
          account_type?: string | null
          mapsite_id?: string | null
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
      payments: {
        Row: {
          id: string
          product_name: string
          amount: number
          user_name: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          product_name: string
          amount: number
          user_name: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          product_name?: string
          amount?: number
          user_name?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          id: string
          user_id: string | null
          email: string
          account_type: string
          fast_code: string | null
          amount_paid: number
          monthly_subscription: number
          registration_number: string
          paypal_order_id: string | null
          paypal_capture_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          account_type: string
          fast_code?: string | null
          amount_paid: number
          monthly_subscription: number
          registration_number: string
          paypal_order_id?: string | null
          paypal_capture_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          account_type?: string
          fast_code?: string | null
          amount_paid?: number
          monthly_subscription?: number
          registration_number?: string
          paypal_order_id?: string | null
          paypal_capture_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      talispros_payments: {
        Row: {
          id: string
          email: string
          plan_type: string
          paypal_order_id: string | null
          paypal_capture_id: string | null
          payment_status: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          plan_type: string
          paypal_order_id?: string | null
          paypal_capture_id?: string | null
          payment_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan_type?: string
          paypal_order_id?: string | null
          paypal_capture_id?: string | null
          payment_status?: string
          created_at?: string
        }
        Relationships: []
      }
      mapsites: {
        Row: {
          id: string
          fast_code: string
          slug: string
          account_type: string
          owner_first_name: string
          owner_last_name: string
          email: string
          phone: string
          status: string
          account_id: string | null
          property_title: string | null
          profile_image_url: string | null
          video_url: string | null
          gallery_images: string[]
          gallery_items: unknown
          property_address: string | null
          property_description: string | null
          latitude: number | null
          longitude: number | null
          price: string | null
          logo_url: string | null
          header_image_url: string | null
          website: string | null
          map_zoom: number | null
          meta_title: string | null
          meta_description: string | null
          og_image_url: string | null
          agent_name: string | null
          atlist_map_url: string | null
          offered_subscription_tier: string
          interest_form_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fast_code: string
          slug: string
          account_type?: string
          owner_first_name: string
          owner_last_name: string
          email: string
          phone?: string
          status?: string
          account_id?: string | null
          property_title?: string | null
          profile_image_url?: string | null
          video_url?: string | null
          gallery_images?: string[]
          gallery_items?: unknown
          property_address?: string | null
          property_description?: string | null
          latitude?: number | null
          longitude?: number | null
          price?: string | null
          logo_url?: string | null
          header_image_url?: string | null
          website?: string | null
          map_zoom?: number | null
          meta_title?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          agent_name?: string | null
          atlist_map_url?: string | null
          offered_subscription_tier?: string
          interest_form_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fast_code?: string
          slug?: string
          account_type?: string
          owner_first_name?: string
          owner_last_name?: string
          email?: string
          phone?: string
          status?: string
          account_id?: string | null
          property_title?: string | null
          profile_image_url?: string | null
          video_url?: string | null
          gallery_images?: string[]
          gallery_items?: unknown
          property_address?: string | null
          property_description?: string | null
          latitude?: number | null
          longitude?: number | null
          price?: string | null
          logo_url?: string | null
          header_image_url?: string | null
          website?: string | null
          map_zoom?: number | null
          meta_title?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          agent_name?: string | null
          atlist_map_url?: string | null
          offered_subscription_tier?: string
          interest_form_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "mapsites_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          description: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color: string
          description?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          description?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          first_name: string
          middle_name: string | null
          last_name: string
          fast_code: string
          email: string | null
          user_id: string | null
          account_type: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          middle_name?: string | null
          last_name: string
          fast_code: string
          email?: string | null
          user_id?: string | null
          account_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          middle_name?: string | null
          last_name?: string
          fast_code?: string
          email?: string | null
          user_id?: string | null
          account_type?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "accounts_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      pins: {
        Row: {
          id: string
          mapsite_id: string
          name: string
          description: string
          category_id: string | null
          latitude: number
          longitude: number
          address: string
          city: string
          province: string
          postal_code: string
          country: string
          website: string
          phone: string
          email: string
          featured: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          mapsite_id: string
          name: string
          description?: string
          category_id?: string | null
          latitude: number
          longitude: number
          address?: string
          city?: string
          province?: string
          postal_code?: string
          country?: string
          website?: string
          phone?: string
          email?: string
          featured?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          mapsite_id?: string
          name?: string
          description?: string
          category_id?: string | null
          latitude?: number
          longitude?: number
          address?: string
          city?: string
          province?: string
          postal_code?: string
          country?: string
          website?: string
          phone?: string
          email?: string
          featured?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "pins_mapsite_id_fkey"; columns: ["mapsite_id"]; referencedRelation: "mapsites"; referencedColumns: ["id"] },
          { foreignKeyName: "pins_category_id_fkey"; columns: ["category_id"]; referencedRelation: "categories"; referencedColumns: ["id"] }
        ]
      }
      client_marketing_metrics: {
        Row: {
          id: string
          fast_code: string
          report_date: string
          facebook_impressions: number
          instagram_impressions: number
          total_reach: number
          emails_received: number
          texts_received: number
          pipeline_status: string
          checklist_notes: string | null
          posted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          fast_code: string
          report_date: string
          facebook_impressions?: number
          instagram_impressions?: number
          total_reach?: number
          emails_received?: number
          texts_received?: number
          pipeline_status?: string
          checklist_notes?: string | null
          posted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          fast_code?: string
          report_date?: string
          facebook_impressions?: number
          instagram_impressions?: number
          total_reach?: number
          emails_received?: number
          texts_received?: number
          pipeline_status?: string
          checklist_notes?: string | null
          posted_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      client_weekly_reports: {
        Row: {
          id: string
          fast_code: string
          week_start: string
          week_end: string
          summary_text: string
          facebook_impressions_total: number
          instagram_impressions_total: number
          total_reach_total: number
          emails_received_total: number
          texts_received_total: number
          pipeline_status: string
          generated_at: string
        }
        Insert: {
          id?: string
          fast_code: string
          week_start: string
          week_end: string
          summary_text: string
          facebook_impressions_total?: number
          instagram_impressions_total?: number
          total_reach_total?: number
          emails_received_total?: number
          texts_received_total?: number
          pipeline_status?: string
          generated_at?: string
        }
        Update: {
          id?: string
          fast_code?: string
          week_start?: string
          week_end?: string
          summary_text?: string
          facebook_impressions_total?: number
          instagram_impressions_total?: number
          total_reach_total?: number
          emails_received_total?: number
          texts_received_total?: number
          pipeline_status?: string
          generated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
