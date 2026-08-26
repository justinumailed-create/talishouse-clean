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
          manual_placement: boolean
          reverse_geocoded_address: string | null
          pin_writeup: string | null
          future_pin_color: string | null
          future_pin_icon: string | null
          future_pin_border: string | null
          future_pin_label: string | null
          future_pin_white_center: boolean
          future_pin_animated: boolean
          future_pin_category_badge: string | null
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
          adpro_category: string | null
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
          manual_placement?: boolean
          reverse_geocoded_address?: string | null
          pin_writeup?: string | null
          future_pin_color?: string | null
          future_pin_icon?: string | null
          future_pin_border?: string | null
          future_pin_label?: string | null
          future_pin_white_center?: boolean
          future_pin_animated?: boolean
          future_pin_category_badge?: string | null
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
          adpro_category?: string | null
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
          manual_placement?: boolean
          reverse_geocoded_address?: string | null
          pin_writeup?: string | null
          future_pin_color?: string | null
          future_pin_icon?: string | null
          future_pin_border?: string | null
          future_pin_label?: string | null
          future_pin_white_center?: boolean
          future_pin_animated?: boolean
          future_pin_category_badge?: string | null
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
          adpro_category?: string | null
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
          cover_image: string | null
          mls_url: string | null
          broker_url: string | null
          teb_url: string | null
          ttv_url: string | null
          assigned_marketing_manager: string | null
          is_demonstration: boolean
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
          cover_image?: string | null
          mls_url?: string | null
          broker_url?: string | null
          teb_url?: string | null
          ttv_url?: string | null
          assigned_marketing_manager?: string | null
          is_demonstration?: boolean
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
          cover_image?: string | null
          mls_url?: string | null
          broker_url?: string | null
          teb_url?: string | null
          ttv_url?: string | null
          assigned_marketing_manager?: string | null
          is_demonstration?: boolean
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
      corporate_markets: {
        Row: {
          id: string
          code: string
          name: string
          country: string | null
          region: string | null
          pmc_pin_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          country?: string | null
          region?: string | null
          pmc_pin_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          country?: string | null
          region?: string | null
          pmc_pin_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      corporate_market_memberships: {
        Row: {
          id: string
          corporate_market_id: string
          account_id: string
          account_role: string
          parent_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          corporate_market_id: string
          account_id: string
          account_role: string
          parent_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          corporate_market_id?: string
          account_id?: string
          account_role?: string
          parent_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "corporate_market_memberships_corporate_market_id_fkey"; columns: ["corporate_market_id"]; referencedRelation: "corporate_markets"; referencedColumns: ["id"] },
          { foreignKeyName: "corporate_market_memberships_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "corporate_market_memberships_parent_account_id_fkey"; columns: ["parent_account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
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
      talismaps_maps: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          status: string
          account_id: string | null
          parent_map_id: string | null
          mapsite_id: string | null
          fast_code: string | null
          account_type: string
          default_latitude: number | null
          default_longitude: number | null
          default_zoom: number
          is_public: boolean
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          status?: string
          account_id?: string | null
          parent_map_id?: string | null
          mapsite_id?: string | null
          fast_code?: string | null
          account_type?: string
          default_latitude?: number | null
          default_longitude?: number | null
          default_zoom?: number
          is_public?: boolean
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          status?: string
          account_id?: string | null
          parent_map_id?: string | null
          mapsite_id?: string | null
          fast_code?: string | null
          account_type?: string
          default_latitude?: number | null
          default_longitude?: number | null
          default_zoom?: number
          is_public?: boolean
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_maps_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_maps_parent_map_id_fkey"; columns: ["parent_map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_maps_mapsite_id_fkey"; columns: ["mapsite_id"]; referencedRelation: "mapsites"; referencedColumns: ["id"] }
        ]
      }
      talismaps_pin_categories: {
        Row: {
          id: string
          map_id: string
          name: string
          slug: string
          color: string
          icon: string
          description: string
          sort_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          map_id: string
          name: string
          slug: string
          color?: string
          icon?: string
          description?: string
          sort_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          name?: string
          slug?: string
          color?: string
          icon?: string
          description?: string
          sort_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_pin_categories_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_pins: {
        Row: {
          id: string
          map_id: string
          category_id: string | null
          name: string
          description: string
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
          pin_type: string
          featured: boolean
          sort_order: number
          owner_id: string | null
          visibility: string
          theme_id: string | null
          status: string
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          map_id: string
          category_id?: string | null
          name: string
          description?: string
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
          pin_type?: string
          featured?: boolean
          sort_order?: number
          owner_id?: string | null
          visibility?: string
          theme_id?: string | null
          status?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          category_id?: string | null
          name?: string
          description?: string
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
          pin_type?: string
          featured?: boolean
          sort_order?: number
          owner_id?: string | null
          visibility?: string
          theme_id?: string | null
          status?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_pins_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_pins_category_id_fkey"; columns: ["category_id"]; referencedRelation: "talismaps_pin_categories"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_pins_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_pins_theme_id_fkey"; columns: ["theme_id"]; referencedRelation: "talismaps_map_themes"; referencedColumns: ["id"] }
        ]
      }
      talismaps_pin_media: {
        Row: {
          id: string
          pin_id: string
          media_type: string
          url: string
          alt_text: string
          caption: string
          sort_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pin_id: string
          media_type?: string
          url: string
          alt_text?: string
          caption?: string
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pin_id?: string
          media_type?: string
          url?: string
          alt_text?: string
          caption?: string
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_pin_media_pin_id_fkey"; columns: ["pin_id"]; referencedRelation: "talismaps_map_pins"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_themes: {
        Row: {
          id: string
          map_id: string
          name: string
          is_active: boolean
          primary_color: string
          accent_color: string
          pin_style: string
          map_style: string
          custom_css: string
          config: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          map_id: string
          name: string
          is_active?: boolean
          primary_color?: string
          accent_color?: string
          pin_style?: string
          map_style?: string
          custom_css?: string
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          name?: string
          is_active?: boolean
          primary_color?: string
          accent_color?: string
          pin_style?: string
          map_style?: string
          custom_css?: string
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_themes_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_views: {
        Row: {
          id: string
          map_id: string
          name: string
          latitude: number
          longitude: number
          zoom: number
          bearing: number
          pitch: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          map_id: string
          name: string
          latitude: number
          longitude: number
          zoom?: number
          bearing?: number
          pitch?: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          name?: string
          latitude?: number
          longitude?: number
          zoom?: number
          bearing?: number
          pitch?: number
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_views_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_analytics: {
        Row: {
          id: string
          map_id: string
          event_type: string
          pin_id: string | null
          session_id: string | null
          referrer: string
          user_agent: string
          metadata: Record<string, unknown>
          recorded_at: string
        }
        Insert: {
          id?: string
          map_id: string
          event_type: string
          pin_id?: string | null
          session_id?: string | null
          referrer?: string
          user_agent?: string
          metadata?: Record<string, unknown>
          recorded_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          event_type?: string
          pin_id?: string | null
          session_id?: string | null
          referrer?: string
          user_agent?: string
          metadata?: Record<string, unknown>
          recorded_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_analytics_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_analytics_pin_id_fkey"; columns: ["pin_id"]; referencedRelation: "talismaps_map_pins"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_permissions: {
        Row: {
          id: string
          map_id: string
          account_id: string | null
          email: string | null
          role: string
          granted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          map_id: string
          account_id?: string | null
          email?: string | null
          role?: string
          granted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          account_id?: string | null
          email?: string | null
          role?: string
          granted_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_permissions_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_permissions_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_permissions_granted_by_fkey"; columns: ["granted_by"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_assets: {
        Row: {
          id: string
          map_id: string
          asset_type: string
          name: string
          url: string
          file_size: number | null
          mime_type: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          map_id: string
          asset_type?: string
          name: string
          url: string
          file_size?: number | null
          mime_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          asset_type?: string
          name?: string
          url?: string
          file_size?: number | null
          mime_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_assets_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] }
        ]
      }
      talismaps_map_invitations: {
        Row: {
          id: string
          map_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          status: string
          expires_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          map_id: string
          email: string
          role?: string
          token?: string
          invited_by?: string | null
          status?: string
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          map_id?: string
          email?: string
          role?: string
          token?: string
          invited_by?: string | null
          status?: string
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talismaps_map_invitations_map_id_fkey"; columns: ["map_id"]; referencedRelation: "talismaps_maps"; referencedColumns: ["id"] },
          { foreignKeyName: "talismaps_map_invitations_invited_by_fkey"; columns: ["invited_by"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      talismaps_platform_settings: {
        Row: {
          id: string
          default_provider_id: string
          default_basemap_view: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          default_provider_id?: string
          default_basemap_view?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          default_provider_id?: string
          default_basemap_view?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      talisbooks_authors: {
        Row: {
          id: string
          slug: string
          name: string
          email: string
          bio: string
          avatar_url: string
          account_id: string | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          email?: string
          bio?: string
          avatar_url?: string
          account_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          email?: string
          bio?: string
          avatar_url?: string
          account_id?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_authors_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_templates: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          template_type: string
          preview_url: string
          config: Record<string, unknown>
          is_system: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          template_type?: string
          preview_url?: string
          config?: Record<string, unknown>
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          template_type?: string
          preview_url?: string
          config?: Record<string, unknown>
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      talisbooks_layouts: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          layout_type: string
          grid_config: Record<string, unknown>
          css_classes: string
          config: Record<string, unknown>
          is_system: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string
          layout_type?: string
          grid_config?: Record<string, unknown>
          css_classes?: string
          config?: Record<string, unknown>
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          layout_type?: string
          grid_config?: Record<string, unknown>
          css_classes?: string
          config?: Record<string, unknown>
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      talisbooks_images: {
        Row: {
          id: string
          author_id: string | null
          book_id: string | null
          parent_image_id: string | null
          image_role: string
          orientation: string | null
          processing_status: string
          name: string
          url: string
          alt_text: string
          caption: string
          width: number | null
          height: number | null
          mime_type: string
          file_size: number | null
          storage_path: string
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id?: string | null
          book_id?: string | null
          parent_image_id?: string | null
          image_role?: string
          orientation?: string | null
          processing_status?: string
          name: string
          url: string
          alt_text?: string
          caption?: string
          width?: number | null
          height?: number | null
          mime_type?: string
          file_size?: number | null
          storage_path?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string | null
          book_id?: string | null
          parent_image_id?: string | null
          image_role?: string
          orientation?: string | null
          processing_status?: string
          name?: string
          url?: string
          alt_text?: string
          caption?: string
          width?: number | null
          height?: number | null
          mime_type?: string
          file_size?: number | null
          storage_path?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_images_author_id_fkey"; columns: ["author_id"]; referencedRelation: "talisbooks_authors"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_images_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_images_parent_image_id_fkey"; columns: ["parent_image_id"]; referencedRelation: "talisbooks_images"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_books: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string
          description: string
          publish_status: string
          author_id: string | null
          template_id: string | null
          cover_image_id: string | null
          account_id: string | null
          mapsite_id: string | null
          fast_code: string | null
          parent_book_id: string | null
          account_type: string
          locale: string
          page_count: number
          is_public: boolean
          is_pinned: boolean
          published_at: string | null
          scheduled_at: string | null
          settings: Record<string, unknown>
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string
          description?: string
          publish_status?: string
          author_id?: string | null
          template_id?: string | null
          cover_image_id?: string | null
          account_id?: string | null
          mapsite_id?: string | null
          fast_code?: string | null
          parent_book_id?: string | null
          account_type?: string
          locale?: string
          page_count?: number
          is_public?: boolean
          is_pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          settings?: Record<string, unknown>
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string
          description?: string
          publish_status?: string
          author_id?: string | null
          template_id?: string | null
          cover_image_id?: string | null
          account_id?: string | null
          mapsite_id?: string | null
          fast_code?: string | null
          parent_book_id?: string | null
          account_type?: string
          locale?: string
          page_count?: number
          is_public?: boolean
          is_pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          settings?: Record<string, unknown>
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_books_author_id_fkey"; columns: ["author_id"]; referencedRelation: "talisbooks_authors"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_books_template_id_fkey"; columns: ["template_id"]; referencedRelation: "talisbooks_templates"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_books_cover_image_id_fkey"; columns: ["cover_image_id"]; referencedRelation: "talisbooks_images"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_books_account_id_fkey"; columns: ["account_id"]; referencedRelation: "accounts"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_books_mapsite_id_fkey"; columns: ["mapsite_id"]; referencedRelation: "mapsites"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_books_parent_book_id_fkey"; columns: ["parent_book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_pages: {
        Row: {
          id: string
          book_id: string
          layout_id: string | null
          template_id: string | null
          title: string
          slug: string
          page_number: number
          sort_order: number
          content: Record<string, unknown>
          background_image_id: string | null
          is_visible: boolean
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          layout_id?: string | null
          template_id?: string | null
          title?: string
          slug?: string
          page_number?: number
          sort_order?: number
          content?: Record<string, unknown>
          background_image_id?: string | null
          is_visible?: boolean
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          layout_id?: string | null
          template_id?: string | null
          title?: string
          slug?: string
          page_number?: number
          sort_order?: number
          content?: Record<string, unknown>
          background_image_id?: string | null
          is_visible?: boolean
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_pages_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_pages_layout_id_fkey"; columns: ["layout_id"]; referencedRelation: "talisbooks_layouts"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_pages_template_id_fkey"; columns: ["template_id"]; referencedRelation: "talisbooks_templates"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_pages_background_image_id_fkey"; columns: ["background_image_id"]; referencedRelation: "talisbooks_images"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_publish_events: {
        Row: {
          id: string
          book_id: string
          from_status: string | null
          to_status: string
          note: string
          changed_by: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          from_status?: string | null
          to_status: string
          note?: string
          changed_by?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          from_status?: string | null
          to_status?: string
          note?: string
          changed_by?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_publish_events_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_publish_events_changed_by_fkey"; columns: ["changed_by"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_media: {
        Row: {
          id: string
          book_id: string
          page_id: string | null
          media_type: string
          name: string
          url: string
          alt_text: string
          caption: string
          width: number | null
          height: number | null
          mime_type: string
          file_size: number | null
          storage_path: string
          sort_order: number
          is_primary: boolean
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          page_id?: string | null
          media_type?: string
          name: string
          url: string
          alt_text?: string
          caption?: string
          width?: number | null
          height?: number | null
          mime_type?: string
          file_size?: number | null
          storage_path?: string
          sort_order?: number
          is_primary?: boolean
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          page_id?: string | null
          media_type?: string
          name?: string
          url?: string
          alt_text?: string
          caption?: string
          width?: number | null
          height?: number | null
          mime_type?: string
          file_size?: number | null
          storage_path?: string
          sort_order?: number
          is_primary?: boolean
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_media_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_media_page_id_fkey"; columns: ["page_id"]; referencedRelation: "talisbooks_book_pages"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_assets: {
        Row: {
          id: string
          book_id: string
          asset_type: string
          name: string
          url: string
          file_size: number | null
          mime_type: string
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          asset_type?: string
          name: string
          url: string
          file_size?: number | null
          mime_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          asset_type?: string
          name?: string
          url?: string
          file_size?: number | null
          mime_type?: string
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_assets_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_themes: {
        Row: {
          id: string
          book_id: string
          name: string
          is_active: boolean
          primary_color: string
          accent_color: string
          typography_scale: string
          page_style: string
          custom_css: string
          config: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          name: string
          is_active?: boolean
          primary_color?: string
          accent_color?: string
          typography_scale?: string
          page_style?: string
          custom_css?: string
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          name?: string
          is_active?: boolean
          primary_color?: string
          accent_color?: string
          typography_scale?: string
          page_style?: string
          custom_css?: string
          config?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_themes_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_analytics: {
        Row: {
          id: string
          book_id: string
          page_id: string | null
          event_type: string
          session_id: string | null
          referrer: string
          user_agent: string
          metadata: Record<string, unknown>
          recorded_at: string
        }
        Insert: {
          id?: string
          book_id: string
          page_id?: string | null
          event_type: string
          session_id?: string | null
          referrer?: string
          user_agent?: string
          metadata?: Record<string, unknown>
          recorded_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          page_id?: string | null
          event_type?: string
          session_id?: string | null
          referrer?: string
          user_agent?: string
          metadata?: Record<string, unknown>
          recorded_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_analytics_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_analytics_page_id_fkey"; columns: ["page_id"]; referencedRelation: "talisbooks_book_pages"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_versions: {
        Row: {
          id: string
          book_id: string
          version_number: number
          label: string
          snapshot: Record<string, unknown>
          publish_status: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          version_number?: number
          label?: string
          snapshot?: Record<string, unknown>
          publish_status?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          version_number?: number
          label?: string
          snapshot?: Record<string, unknown>
          publish_status?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_versions_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] },
          { foreignKeyName: "talisbooks_book_versions_created_by_fkey"; columns: ["created_by"]; referencedRelation: "accounts"; referencedColumns: ["id"] }
        ]
      }
      talisbooks_book_settings: {
        Row: {
          id: string
          book_id: string | null
          scope: string
          viewer_auto_turn_ms: number
          viewer_pause_on_hover: boolean
          narration_enabled: boolean
          default_locale: string
          config: Record<string, unknown>
          updated_at: string
        }
        Insert: {
          id?: string
          book_id?: string | null
          scope?: string
          viewer_auto_turn_ms?: number
          viewer_pause_on_hover?: boolean
          narration_enabled?: boolean
          default_locale?: string
          config?: Record<string, unknown>
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string | null
          scope?: string
          viewer_auto_turn_ms?: number
          viewer_pause_on_hover?: boolean
          narration_enabled?: boolean
          default_locale?: string
          config?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "talisbooks_book_settings_book_id_fkey"; columns: ["book_id"]; referencedRelation: "talisbooks_books"; referencedColumns: ["id"] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
