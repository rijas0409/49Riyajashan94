export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string | null
          id: string
          is_default: boolean | null
          pincode: string
          state: string
          user_id: string | null
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pincode: string
          state: string
          user_id?: string | null
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          pincode?: string
          state?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          sent_by: string
          target_role: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sent_by: string
          target_role?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sent_by?: string
          target_role?: string
          title?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_style: string
          border_radius: string | null
          created_at: string
          cta_alignment: string
          cta_link: string | null
          cta_text: string | null
          custom_height: string | null
          custom_width: string | null
          gradient: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          location: string
          placement: string
          position: number
          subtitle: string | null
          target_route: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_style?: string
          border_radius?: string | null
          created_at?: string
          cta_alignment?: string
          cta_link?: string | null
          cta_text?: string | null
          custom_height?: string | null
          custom_width?: string | null
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          location?: string
          placement?: string
          position?: number
          subtitle?: string | null
          target_route?: string
          title?: string
          updated_at?: string
        }
        Update: {
          banner_style?: string
          border_radius?: string | null
          created_at?: string
          cta_alignment?: string
          cta_link?: string | null
          cta_text?: string | null
          custom_height?: string | null
          custom_width?: string | null
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          location?: string
          placement?: string
          position?: number
          subtitle?: string | null
          target_route?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_activity: {
        Row: {
          activity_type: string
          created_at: string
          duration_seconds: number | null
          entity_id: string
          entity_image: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          duration_seconds?: number | null
          entity_id: string
          entity_image?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_seconds?: number | null
          entity_id?: string
          entity_image?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          pet_id: string | null
          seller_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          pet_id?: string | null
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          pet_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          pet_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pet_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pet_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_paid: number | null
          amount: number
          buyer_address_id: string | null
          buyer_id: string | null
          created_at: string | null
          id: string
          payment_id: string | null
          pet_id: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          transport_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          advance_paid?: number | null
          amount: number
          buyer_address_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          pet_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          transport_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          advance_paid?: number | null
          amount?: number
          buyer_address_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          pet_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          transport_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_address_id_fkey"
            columns: ["buyer_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_documents: {
        Row: {
          document_type: string
          file_url: string
          id: string
          ocr_data: Json | null
          pet_id: string | null
          uploaded_at: string | null
          verified: boolean | null
        }
        Insert: {
          document_type: string
          file_url: string
          id?: string
          ocr_data?: Json | null
          pet_id?: string | null
          uploaded_at?: string | null
          verified?: boolean | null
        }
        Update: {
          document_type?: string
          file_url?: string
          id?: string
          ocr_data?: Json | null
          pet_id?: string | null
          uploaded_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_documents_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_vaccinations: {
        Row: {
          certificate_name: string | null
          certificate_url: string | null
          created_at: string
          date_administered: string
          dose_number: string
          id: string
          next_due_date: string | null
          pet_id: string
          vaccine_type: string
        }
        Insert: {
          certificate_name?: string | null
          certificate_url?: string | null
          created_at?: string
          date_administered: string
          dose_number: string
          id?: string
          next_due_date?: string | null
          pet_id: string
          vaccine_type: string
        }
        Update: {
          certificate_name?: string | null
          certificate_url?: string | null
          created_at?: string
          date_administered?: string
          dose_number?: string
          id?: string
          next_due_date?: string | null
          pet_id?: string
          vaccine_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_months: number
          age_type: string | null
          birth_date: string | null
          bloodline: string | null
          breed: string
          category: Database["public"]["Enums"]["pet_category"]
          city: string
          color: string | null
          created_at: string | null
          description: string | null
          gender: Database["public"]["Enums"]["pet_gender"]
          id: string
          images: string[] | null
          is_available: boolean | null
          is_featured: boolean | null
          location: string
          medical_history: string | null
          microchip: string | null
          name: string
          original_price: number | null
          owner_id: string | null
          price: number
          priority_fee_paid: boolean | null
          priority_verification: boolean | null
          registered_with: string | null
          size: string | null
          state: string
          updated_at: string | null
          vaccinated: boolean | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos: string[] | null
          views: number | null
          weight_kg: number | null
        }
        Insert: {
          age_months: number
          age_type?: string | null
          birth_date?: string | null
          bloodline?: string | null
          breed: string
          category: Database["public"]["Enums"]["pet_category"]
          city: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          gender: Database["public"]["Enums"]["pet_gender"]
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          location: string
          medical_history?: string | null
          microchip?: string | null
          name: string
          original_price?: number | null
          owner_id?: string | null
          price: number
          priority_fee_paid?: boolean | null
          priority_verification?: boolean | null
          registered_with?: string | null
          size?: string | null
          state: string
          updated_at?: string | null
          vaccinated?: boolean | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos?: string[] | null
          views?: number | null
          weight_kg?: number | null
        }
        Update: {
          age_months?: number
          age_type?: string | null
          birth_date?: string | null
          bloodline?: string | null
          breed?: string
          category?: Database["public"]["Enums"]["pet_category"]
          city?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          gender?: Database["public"]["Enums"]["pet_gender"]
          id?: string
          images?: string[] | null
          is_available?: boolean | null
          is_featured?: boolean | null
          location?: string
          medical_history?: string | null
          microchip?: string | null
          name?: string
          original_price?: number | null
          owner_id?: string | null
          price?: number
          priority_fee_paid?: boolean | null
          priority_verification?: boolean | null
          registered_with?: string | null
          size?: string | null
          state?: string
          updated_at?: string | null
          vaccinated?: boolean | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos?: string[] | null
          views?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          quantity: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          quantity?: number
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_file: string | null
          address: string | null
          breeder_license: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          is_admin_approved: boolean | null
          is_breeder_verified: boolean | null
          is_onboarding_complete: boolean | null
          name: string
          pan_card_file: string | null
          phone: string | null
          priority_fee_paid: boolean | null
          profile_photo: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"]
          selfie_file: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_file?: string | null
          address?: string | null
          breeder_license?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id: string
          is_admin_approved?: boolean | null
          is_breeder_verified?: boolean | null
          is_onboarding_complete?: boolean | null
          name: string
          pan_card_file?: string | null
          phone?: string | null
          priority_fee_paid?: boolean | null
          profile_photo?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_file?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_file?: string | null
          address?: string | null
          breeder_license?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          is_admin_approved?: boolean | null
          is_breeder_verified?: boolean | null
          is_onboarding_complete?: boolean | null
          name?: string
          pan_card_file?: string | null
          phone?: string | null
          priority_fee_paid?: boolean | null
          profile_photo?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          selfie_file?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          pet_id: string | null
          reason: string
          reporter_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pet_id?: string | null
          reason: string
          reporter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pet_id?: string | null
          reason?: string
          reporter_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_earnings: {
        Row: {
          amount: number
          commission: number
          created_at: string | null
          id: string
          net_amount: number
          order_id: string | null
          payout_date: string | null
          payout_status: string | null
          seller_id: string | null
        }
        Insert: {
          amount: number
          commission: number
          created_at?: string | null
          id?: string
          net_amount: number
          order_id?: string | null
          payout_date?: string | null
          payout_status?: string | null
          seller_id?: string | null
        }
        Update: {
          amount?: number
          commission?: number
          created_at?: string | null
          id?: string
          net_amount?: number
          order_id?: string | null
          payout_date?: string | null
          payout_status?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_earnings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          batch_number: string | null
          brand: string
          brand_authorization: string | null
          breed_applicable: string[] | null
          category: string
          country_of_origin: string | null
          created_at: string
          delivery_scope: string | null
          description: string | null
          discount: number | null
          dispatch_city: string | null
          expiry_date: string | null
          feeding_guide: Json | null
          fssai_certificate: string | null
          gst_certificate: string | null
          gst_inclusive: boolean | null
          handling_time: string | null
          highlights: string[] | null
          id: string
          images: string[] | null
          ingredients: string[] | null
          is_active: boolean | null
          is_draft: boolean | null
          low_stock_alert: boolean | null
          name: string
          original_price: number | null
          pet_type: string
          price: number
          priority_fee_paid: boolean | null
          priority_verification: boolean | null
          return_policy: string | null
          seller_id: string
          shipping_charges: number | null
          shipping_free: boolean | null
          sku: string | null
          stock: number
          storage_instructions: string | null
          tags: string[] | null
          tax_percentage: number | null
          total_sold: number | null
          trade_license: string | null
          unit: string | null
          updated_at: string
          variants: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos: string[] | null
          views: number | null
          warranty: string | null
          weight: string | null
        }
        Insert: {
          batch_number?: string | null
          brand?: string
          brand_authorization?: string | null
          breed_applicable?: string[] | null
          category: string
          country_of_origin?: string | null
          created_at?: string
          delivery_scope?: string | null
          description?: string | null
          discount?: number | null
          dispatch_city?: string | null
          expiry_date?: string | null
          feeding_guide?: Json | null
          fssai_certificate?: string | null
          gst_certificate?: string | null
          gst_inclusive?: boolean | null
          handling_time?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_draft?: boolean | null
          low_stock_alert?: boolean | null
          name: string
          original_price?: number | null
          pet_type: string
          price: number
          priority_fee_paid?: boolean | null
          priority_verification?: boolean | null
          return_policy?: string | null
          seller_id: string
          shipping_charges?: number | null
          shipping_free?: boolean | null
          sku?: string | null
          stock?: number
          storage_instructions?: string | null
          tags?: string[] | null
          tax_percentage?: number | null
          total_sold?: number | null
          trade_license?: string | null
          unit?: string | null
          updated_at?: string
          variants?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos?: string[] | null
          views?: number | null
          warranty?: string | null
          weight?: string | null
        }
        Update: {
          batch_number?: string | null
          brand?: string
          brand_authorization?: string | null
          breed_applicable?: string[] | null
          category?: string
          country_of_origin?: string | null
          created_at?: string
          delivery_scope?: string | null
          description?: string | null
          discount?: number | null
          dispatch_city?: string | null
          expiry_date?: string | null
          feeding_guide?: Json | null
          fssai_certificate?: string | null
          gst_certificate?: string | null
          gst_inclusive?: boolean | null
          handling_time?: string | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_draft?: boolean | null
          low_stock_alert?: boolean | null
          name?: string
          original_price?: number | null
          pet_type?: string
          price?: number
          priority_fee_paid?: boolean | null
          priority_verification?: boolean | null
          return_policy?: string | null
          seller_id?: string
          shipping_charges?: number | null
          shipping_free?: boolean | null
          sku?: string | null
          stock?: number
          storage_instructions?: string | null
          tags?: string[] | null
          tax_percentage?: number | null
          total_sold?: number | null
          trade_license?: string | null
          unit?: string | null
          updated_at?: string
          variants?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          videos?: string[] | null
          views?: number | null
          warranty?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          seller_id: string | null
          start_date: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          seller_id?: string | null
          start_date: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          seller_id?: string | null
          start_date?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_requests: {
        Row: {
          assigned_partner_id: string | null
          buyer_id: string | null
          created_at: string | null
          delivery_address: string
          distance_km: number | null
          fee: number
          id: string
          order_id: string | null
          pet_id: string | null
          pickup_address: string
          platform_margin_percent: number | null
          seller_id: string | null
          status: Database["public"]["Enums"]["transport_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_partner_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          delivery_address: string
          distance_km?: number | null
          fee: number
          id?: string
          order_id?: string | null
          pet_id?: string | null
          pickup_address: string
          platform_margin_percent?: number | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transport_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_partner_id?: string | null
          buyer_id?: string | null
          created_at?: string | null
          delivery_address?: string
          distance_km?: number | null
          fee?: number
          id?: string
          order_id?: string | null
          pet_id?: string | null
          pickup_address?: string
          platform_margin_percent?: number | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transport_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_advertisements: {
        Row: {
          ad_type: string
          clicks: number | null
          created_at: string
          daily_cost: number
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number | null
          placement: string | null
          start_date: string
          status: string
          target_entity_id: string | null
          target_entity_type: string | null
          target_route: string | null
          title: string
          total_cost: number
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          ad_type?: string
          clicks?: number | null
          created_at?: string
          daily_cost?: number
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          placement?: string | null
          start_date?: string
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_route?: string | null
          title?: string
          total_cost?: number
          updated_at?: string
          user_id: string
          user_role?: string
        }
        Update: {
          ad_type?: string
          clicks?: number | null
          created_at?: string
          daily_cost?: number
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          placement?: string | null
          start_date?: string
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_route?: string | null
          title?: string
          total_cost?: number
          updated_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vet_appointments: {
        Row: {
          amount: number
          appointment_date: string
          appointment_time: string
          appointment_type: string
          call_duration: number | null
          care_instructions: string | null
          consultation_notes: string | null
          created_at: string
          diagnosis: string | null
          id: string
          medicines: string | null
          pet_breed: string | null
          pet_name: string
          pet_type: string
          reschedule_count: number | null
          status: string
          updated_at: string
          user_id: string
          vet_id: string
        }
        Insert: {
          amount?: number
          appointment_date: string
          appointment_time: string
          appointment_type?: string
          call_duration?: number | null
          care_instructions?: string | null
          consultation_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicines?: string | null
          pet_breed?: string | null
          pet_name: string
          pet_type: string
          reschedule_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
          vet_id: string
        }
        Update: {
          amount?: number
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          call_duration?: number | null
          care_instructions?: string | null
          consultation_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicines?: string | null
          pet_breed?: string | null
          pet_name?: string
          pet_type?: string
          reschedule_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          vet_id?: string
        }
        Relationships: []
      }
      vet_earnings: {
        Row: {
          amount: number
          appointment_id: string | null
          commission: number
          created_at: string
          id: string
          net_amount: number
          payout_date: string | null
          payout_status: string
          vet_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          commission?: number
          created_at?: string
          id?: string
          net_amount: number
          payout_date?: string | null
          payout_status?: string
          vet_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          commission?: number
          created_at?: string
          id?: string
          net_amount?: number
          payout_date?: string | null
          payout_status?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_earnings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vet_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_profiles: {
        Row: {
          available_days: string[]
          average_rating: number | null
          awards_certifications: string[] | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          cancelled_cheque_file: string | null
          clinic_address: string | null
          clinic_address_proof_file: string | null
          clinic_photos: string[] | null
          clinic_registration_file: string | null
          clinic_shop_license_file: string | null
          consultation_type: string
          created_at: string
          education_details: Json | null
          evening_slots: boolean | null
          govt_id_file: string | null
          gst_certificate_file: string | null
          id: string
          is_active: boolean | null
          morning_slots: boolean | null
          offline_fee: number
          online_fee: number
          pan_card_file: string | null
          passport_photo_file: string | null
          preferred_language: string | null
          profile_photo: string | null
          qualification: string
          registration_number: string | null
          specializations: string[]
          telemedicine_consent_accepted: boolean | null
          total_consultations: number | null
          updated_at: string
          user_id: string
          vendor_agreement_accepted: boolean | null
          verification_status: string
          vet_degree_file: string | null
          wallet_balance: number | null
          years_of_experience: number
        }
        Insert: {
          available_days?: string[]
          average_rating?: number | null
          awards_certifications?: string[] | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cancelled_cheque_file?: string | null
          clinic_address?: string | null
          clinic_address_proof_file?: string | null
          clinic_photos?: string[] | null
          clinic_registration_file?: string | null
          clinic_shop_license_file?: string | null
          consultation_type?: string
          created_at?: string
          education_details?: Json | null
          evening_slots?: boolean | null
          govt_id_file?: string | null
          gst_certificate_file?: string | null
          id?: string
          is_active?: boolean | null
          morning_slots?: boolean | null
          offline_fee?: number
          online_fee?: number
          pan_card_file?: string | null
          passport_photo_file?: string | null
          preferred_language?: string | null
          profile_photo?: string | null
          qualification?: string
          registration_number?: string | null
          specializations?: string[]
          telemedicine_consent_accepted?: boolean | null
          total_consultations?: number | null
          updated_at?: string
          user_id: string
          vendor_agreement_accepted?: boolean | null
          verification_status?: string
          vet_degree_file?: string | null
          wallet_balance?: number | null
          years_of_experience?: number
        }
        Update: {
          available_days?: string[]
          average_rating?: number | null
          awards_certifications?: string[] | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cancelled_cheque_file?: string | null
          clinic_address?: string | null
          clinic_address_proof_file?: string | null
          clinic_photos?: string[] | null
          clinic_registration_file?: string | null
          clinic_shop_license_file?: string | null
          consultation_type?: string
          created_at?: string
          education_details?: Json | null
          evening_slots?: boolean | null
          govt_id_file?: string | null
          gst_certificate_file?: string | null
          id?: string
          is_active?: boolean | null
          morning_slots?: boolean | null
          offline_fee?: number
          online_fee?: number
          pan_card_file?: string | null
          passport_photo_file?: string | null
          preferred_language?: string | null
          profile_photo?: string | null
          qualification?: string
          registration_number?: string | null
          specializations?: string[]
          telemedicine_consent_accepted?: boolean | null
          total_consultations?: number | null
          updated_at?: string
          user_id?: string
          vendor_agreement_accepted?: boolean | null
          verification_status?: string
          vet_degree_file?: string | null
          wallet_balance?: number | null
          years_of_experience?: number
        }
        Relationships: []
      }
      vet_reviews: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          rating: number
          review_text: string | null
          user_id: string
          vet_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          user_id: string
          vet_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          user_id?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "vet_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          title: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_pets: {
        Row: {
          created_at: string
          id: string
          pet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_products: {
        Row: {
          created_at: string
          id: string
          pet_type: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_type: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_type?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_user_initialized: {
        Args: {
          _email: string
          _name: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      get_public_seller_info: {
        Args: { _seller_id: string }
        Returns: {
          id: string
          is_breeder_verified: boolean
          name: string
          profile_photo: string
          rating: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "picked"
        | "delivered"
        | "cancelled"
      pet_category: "dog" | "cat" | "bird" | "rabbit" | "other"
      pet_gender: "male" | "female"
      subscription_tier: "basic" | "gold" | "platinum"
      transport_status:
        | "requested"
        | "assigned"
        | "picked"
        | "delivered"
        | "completed"
        | "cancelled"
      user_role:
        | "buyer"
        | "seller"
        | "admin"
        | "delivery_partner"
        | "product_seller"
        | "vet"
      verification_status: "pending" | "verified" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "picked",
        "delivered",
        "cancelled",
      ],
      pet_category: ["dog", "cat", "bird", "rabbit", "other"],
      pet_gender: ["male", "female"],
      subscription_tier: ["basic", "gold", "platinum"],
      transport_status: [
        "requested",
        "assigned",
        "picked",
        "delivered",
        "completed",
        "cancelled",
      ],
      user_role: [
        "buyer",
        "seller",
        "admin",
        "delivery_partner",
        "product_seller",
        "vet",
      ],
      verification_status: ["pending", "verified", "failed"],
    },
  },
} as const
