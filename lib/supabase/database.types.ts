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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_role: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          details: string | null
          entity_id: string
          entity_type: string
          id: number
          immutable_hash: string | null
          ip_address: string | null
          provincial_jurisdiction: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          details?: string | null
          entity_id: string
          entity_type: string
          id?: never
          immutable_hash?: string | null
          ip_address?: string | null
          provincial_jurisdiction?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: never
          immutable_hash?: string | null
          ip_address?: string | null
          provincial_jurisdiction?: string | null
        }
        Relationships: []
      }
      auth_challenges: {
        Row: {
          created_at: string
          email_attempts: number
          email_code_hash: string
          email_last_sent_at: string
          expires_at: string
          id: string
          phone_attempts: number
          phone_code_hash: string
          phone_last_sent_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_attempts?: number
          email_code_hash: string
          email_last_sent_at?: string
          expires_at?: string
          id?: string
          phone_attempts?: number
          phone_code_hash: string
          phone_last_sent_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_attempts?: number
          email_code_hash?: string
          email_last_sent_at?: string
          expires_at?: string
          id?: string
          phone_attempts?: number
          phone_code_hash?: string
          phone_last_sent_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount_cents: number
          conditions: string | null
          created_at: string
          dealership_id: string
          id: string
          idempotency_key: string
          listing_id: string
          notes: string | null
          placed_by_user_id: string
          revised_at: string | null
          revision_count: number
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
          version: number
        }
        Insert: {
          amount_cents: number
          conditions?: string | null
          created_at?: string
          dealership_id: string
          id?: string
          idempotency_key: string
          listing_id: string
          notes?: string | null
          placed_by_user_id: string
          revised_at?: string | null
          revision_count?: number
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          amount_cents?: number
          conditions?: string | null
          created_at?: string
          dealership_id?: string
          id?: string
          idempotency_key?: string
          listing_id?: string
          notes?: string | null
          placed_by_user_id?: string
          revised_at?: string | null
          revision_count?: number
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bids_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "bids_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "bids_placed_by_user_id_fkey"
            columns: ["placed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_hotspots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          listing_id: string
          panel: string
          photo_storage_key: string | null
          photo_url: string | null
          severity: Database["public"]["Enums"]["damage_severity"]
          viewpoint: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id: string
          panel: string
          photo_storage_key?: string | null
          photo_url?: string | null
          severity: Database["public"]["Enums"]["damage_severity"]
          viewpoint: string
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string
          panel?: string
          photo_storage_key?: string | null
          photo_url?: string | null
          severity?: Database["public"]["Enums"]["damage_severity"]
          viewpoint?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "damage_hotspots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_hotspots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      dealership_members: {
        Row: {
          dealership_id: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          last_active_at: string | null
          seat_role: Database["public"]["Enums"]["dealer_seat_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          dealership_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          last_active_at?: string | null
          seat_role?: Database["public"]["Enums"]["dealer_seat_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          dealership_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          last_active_at?: string | null
          seat_role?: Database["public"]["Enums"]["dealer_seat_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealership_members_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "dealership_members_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealership_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealership_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          business_number: string | null
          certified_pre_inspection: boolean
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contact_title: string | null
          created_at: string
          id: string
          legal_name: string
          license_doc_path: string | null
          license_expiry: string | null
          license_number: string
          location: unknown
          operating_hours: string
          operating_name: string
          payout_speed_days: number
          postal_code: string
          province: string
          rating: number
          regulator: Database["public"]["Enums"]["regulator_code"]
          review_count: number
          service_radius_km: number
          status: Database["public"]["Enums"]["dealership_status"]
          street_address: string
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          business_number?: string | null
          certified_pre_inspection?: boolean
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          contact_title?: string | null
          created_at?: string
          id?: string
          legal_name: string
          license_doc_path?: string | null
          license_expiry?: string | null
          license_number: string
          location?: unknown
          operating_hours?: string
          operating_name: string
          payout_speed_days?: number
          postal_code: string
          province: string
          rating?: number
          regulator: Database["public"]["Enums"]["regulator_code"]
          review_count?: number
          service_radius_km?: number
          status?: Database["public"]["Enums"]["dealership_status"]
          street_address: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          business_number?: string | null
          certified_pre_inspection?: boolean
          city?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          contact_title?: string | null
          created_at?: string
          id?: string
          legal_name?: string
          license_doc_path?: string | null
          license_expiry?: string | null
          license_number?: string
          location?: unknown
          operating_hours?: string
          operating_name?: string
          payout_speed_days?: number
          postal_code?: string
          province?: string
          rating?: number
          regulator?: Database["public"]["Enums"]["regulator_code"]
          review_count?: number
          service_radius_km?: number
          status?: Database["public"]["Enums"]["dealership_status"]
          street_address?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealerships_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_timeline: {
        Row: {
          action: string
          actor_label: string
          actor_user_id: string | null
          created_at: string
          dispute_id: string
          id: string
          note: string
        }
        Insert: {
          action: string
          actor_label: string
          actor_user_id?: string | null
          created_at?: string
          dispute_id: string
          id?: string
          note: string
        }
        Update: {
          action?: string
          actor_label?: string
          actor_user_id?: string | null
          created_at?: string
          dispute_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_timeline_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_timeline_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          agreed_bid_cents: number
          allegation_summary: string
          assigned_admin_id: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          compliance_decision_notes: string | null
          created_at: string
          disputed_adjustment_cents: number
          docket_number: string
          evidence_photos_json: Json
          hoist_evidence_notes: string | null
          id: string
          listing_id: string
          match_id: string
          net_settlement_cents: number
          raised_by_user_id: string
          resolution_decision: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          technician_name: string | null
          updated_at: string
        }
        Insert: {
          agreed_bid_cents: number
          allegation_summary: string
          assigned_admin_id?: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          compliance_decision_notes?: string | null
          created_at?: string
          disputed_adjustment_cents?: number
          docket_number: string
          evidence_photos_json?: Json
          hoist_evidence_notes?: string | null
          id?: string
          listing_id: string
          match_id: string
          net_settlement_cents: number
          raised_by_user_id: string
          resolution_decision?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          technician_name?: string | null
          updated_at?: string
        }
        Update: {
          agreed_bid_cents?: number
          allegation_summary?: string
          assigned_admin_id?: string | null
          category?: Database["public"]["Enums"]["dispute_category"]
          compliance_decision_notes?: string | null
          created_at?: string
          disputed_adjustment_cents?: number
          docket_number?: string
          evidence_photos_json?: Json
          hoist_evidence_notes?: string | null
          id?: string
          listing_id?: string
          match_id?: string
          net_settlement_cents?: number
          raised_by_user_id?: string
          resolution_decision?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          technician_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_settlement_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_user_id_fkey"
            columns: ["raised_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          doc_storage_path: string | null
          expires_at: string | null
          id: string
          id_doc_type: Database["public"]["Enums"]["id_doc_type"]
          provider: string
          provider_ref: string | null
          reject_reason: string | null
          reviewed_by: string | null
          selfie_storage_path: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          doc_storage_path?: string | null
          expires_at?: string | null
          id?: string
          id_doc_type: Database["public"]["Enums"]["id_doc_type"]
          provider?: string
          provider_ref?: string | null
          reject_reason?: string | null
          reviewed_by?: string | null
          selfie_storage_path?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          doc_storage_path?: string | null
          expires_at?: string | null
          id?: string
          id_doc_type?: Database["public"]["Enums"]["id_doc_type"]
          provider?: string
          provider_ref?: string | null
          reject_reason?: string | null
          reviewed_by?: string | null
          selfie_storage_path?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          is_cover: boolean
          listing_id: string
          mime_type: string | null
          photo_label: string | null
          public_url: string
          sort_order: number
          storage_key: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_cover?: boolean
          listing_id: string
          mime_type?: string | null
          photo_label?: string | null
          public_url: string
          sort_order?: number
          storage_key: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_cover?: boolean
          listing_id?: string
          mime_type?: string | null
          photo_label?: string | null
          public_url?: string
          sort_order?: number
          storage_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listings: {
        Row: {
          accident_count: number
          accident_declaration: boolean
          accident_details: string | null
          auction_ends_at: string | null
          auction_started_at: string | null
          bid_count: number
          body_type: string | null
          carfax_clean: boolean
          carfax_summary_json: Json | null
          city: string
          closed_at: string | null
          created_at: string
          damage_grade: string
          damage_hotspot_count: number
          declaration_accurate_condition: boolean
          declaration_no_unpaid_fines: boolean
          declaration_owner_attested: boolean
          drivetrain: string | null
          engine_spec: string | null
          exterior_color: string | null
          fuel_type: string | null
          has_lien: boolean
          horsepower: number | null
          id: string
          interior_color: string | null
          keys_count: number
          lien_details: string | null
          location: unknown
          make: string
          manual_edits_json: Json
          mileage_km: number
          model: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          parent_listing_id: string | null
          postal_code: string
          province: string
          relist_count: number
          reserve_price_cents: number | null
          seller_id: string
          seller_notes: string | null
          service_history_notes: string | null
          status: Database["public"]["Enums"]["listing_status"]
          tire_condition: string | null
          transmission: string | null
          trim: string
          updated_at: string
          vin: string
          vin_decoded_json: Json | null
          year: number
        }
        Insert: {
          accident_count?: number
          accident_declaration?: boolean
          accident_details?: string | null
          auction_ends_at?: string | null
          auction_started_at?: string | null
          bid_count?: number
          body_type?: string | null
          carfax_clean?: boolean
          carfax_summary_json?: Json | null
          city?: string
          closed_at?: string | null
          created_at?: string
          damage_grade?: string
          damage_hotspot_count?: number
          declaration_accurate_condition?: boolean
          declaration_no_unpaid_fines?: boolean
          declaration_owner_attested?: boolean
          drivetrain?: string | null
          engine_spec?: string | null
          exterior_color?: string | null
          fuel_type?: string | null
          has_lien?: boolean
          horsepower?: number | null
          id?: string
          interior_color?: string | null
          keys_count?: number
          lien_details?: string | null
          location?: unknown
          make: string
          manual_edits_json?: Json
          mileage_km: number
          model: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          parent_listing_id?: string | null
          postal_code: string
          province: string
          relist_count?: number
          reserve_price_cents?: number | null
          seller_id: string
          seller_notes?: string | null
          service_history_notes?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tire_condition?: string | null
          transmission?: string | null
          trim?: string
          updated_at?: string
          vin: string
          vin_decoded_json?: Json | null
          year: number
        }
        Update: {
          accident_count?: number
          accident_declaration?: boolean
          accident_details?: string | null
          auction_ends_at?: string | null
          auction_started_at?: string | null
          bid_count?: number
          body_type?: string | null
          carfax_clean?: boolean
          carfax_summary_json?: Json | null
          city?: string
          closed_at?: string | null
          created_at?: string
          damage_grade?: string
          damage_hotspot_count?: number
          declaration_accurate_condition?: boolean
          declaration_no_unpaid_fines?: boolean
          declaration_owner_attested?: boolean
          drivetrain?: string | null
          engine_spec?: string | null
          exterior_color?: string | null
          fuel_type?: string | null
          has_lien?: boolean
          horsepower?: number | null
          id?: string
          interior_color?: string | null
          keys_count?: number
          lien_details?: string | null
          location?: unknown
          make?: string
          manual_edits_json?: Json
          mileage_km?: number
          model?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          parent_listing_id?: string | null
          postal_code?: string
          province?: string
          relist_count?: number
          reserve_price_cents?: number | null
          seller_id?: string
          seller_notes?: string | null
          service_history_notes?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tire_condition?: string | null
          transmission?: string | null
          trim?: string
          updated_at?: string
          vin?: string
          vin_decoded_json?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_parent_listing_id_fkey"
            columns: ["parent_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_parent_listing_id_fkey"
            columns: ["parent_listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          accept_expires_at: string
          agreed_amount_cents: number
          created_at: string
          dealership_id: string
          final_price_cents: number | null
          id: string
          listing_id: string
          logged_by_user_id: string | null
          outcome: Database["public"]["Enums"]["match_outcome"]
          outcome_logged_at: string | null
          outcome_notes: string | null
          selection_reason: string
          seller_id: string
          updated_at: string
          voucher_code: string
          winning_bid_id: string
        }
        Insert: {
          accept_expires_at: string
          agreed_amount_cents: number
          created_at?: string
          dealership_id: string
          final_price_cents?: number | null
          id?: string
          listing_id: string
          logged_by_user_id?: string | null
          outcome?: Database["public"]["Enums"]["match_outcome"]
          outcome_logged_at?: string | null
          outcome_notes?: string | null
          selection_reason?: string
          seller_id: string
          updated_at?: string
          voucher_code: string
          winning_bid_id: string
        }
        Update: {
          accept_expires_at?: string
          agreed_amount_cents?: number
          created_at?: string
          dealership_id?: string
          final_price_cents?: number | null
          id?: string
          listing_id?: string
          logged_by_user_id?: string | null
          outcome?: Database["public"]["Enums"]["match_outcome"]
          outcome_logged_at?: string | null
          outcome_notes?: string | null
          selection_reason?: string
          seller_id?: string
          updated_at?: string
          voucher_code?: string
          winning_bid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "matches_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "matches_logged_by_user_id_fkey"
            columns: ["logged_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winning_bid_id_fkey"
            columns: ["winning_bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          notification_id: string | null
          provider: string
          provider_message_id: string | null
          recipient_address: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider: string
          provider_message_id?: string | null
          recipient_address?: string | null
          status: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider?: string
          provider_message_id?: string | null
          recipient_address?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          listing_id: string | null
          metadata: Json
          read: boolean
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          listing_id?: string | null
          metadata?: Json
          read?: boolean
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          listing_id?: string | null
          metadata?: Json
          read?: boolean
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          dealership_id: string
          description: string
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          paid_at: string | null
          refunded_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          dealership_id: string
          description: string
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          dealership_id?: string
          description?: string
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "payments_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          features_json: Json
          id: string
          is_active: boolean
          max_radius_km: number
          max_team_seats: number
          monthly_bid_quota: number
          name: string
          price_cents: number
          slug: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_interval: string
          created_at?: string
          currency?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          max_radius_km: number
          max_team_seats?: number
          monthly_bid_quota: number
          name: string
          price_cents: number
          slug: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          features_json?: Json
          id?: string
          is_active?: boolean
          max_radius_km?: number
          max_team_seats?: number
          monthly_bid_quota?: number
          name?: string
          price_cents?: number
          slug?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value_json: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      postal_centroids: {
        Row: {
          city: string
          latitude: number
          location: unknown
          longitude: number
          postal_prefix: string
          province: string
        }
        Insert: {
          city: string
          latitude: number
          location: unknown
          longitude: number
          postal_prefix: string
          province: string
        }
        Update: {
          city?: string
          latitude?: number
          location?: unknown
          longitude?: number
          postal_prefix?: string
          province?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          city: string | null
          created_at: string
          dealership_id: string | null
          deletion_requested_at: string | null
          email: string
          email_verified: boolean
          first_name: string
          id: string
          job_title: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          language_pref: string
          last_name: string
          location: unknown
          marketing_opt_in: boolean
          mfa_enabled: boolean
          phone_e164: string | null
          phone_verified: boolean
          postal_code: string | null
          province: string | null
          regulator_board_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dealership_id?: string | null
          deletion_requested_at?: string | null
          email: string
          email_verified?: boolean
          first_name?: string
          id: string
          job_title?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          language_pref?: string
          last_name?: string
          location?: unknown
          marketing_opt_in?: boolean
          mfa_enabled?: boolean
          phone_e164?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          province?: string | null
          regulator_board_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          dealership_id?: string | null
          deletion_requested_at?: string | null
          email?: string
          email_verified?: boolean
          first_name?: string
          id?: string
          job_title?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          language_pref?: string
          last_name?: string
          location?: unknown
          marketing_opt_in?: boolean
          mfa_enabled?: boolean
          phone_e164?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          province?: string | null
          regulator_board_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "profiles_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          payload_summary: Json | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          payload_summary?: Json | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          payload_summary?: Json | null
          processed_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          bids_used: number
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          dealership_id: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          bids_used?: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          dealership_id: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          bids_used?: number
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          dealership_id?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: true
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "subscriptions_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: true
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          granted: boolean
          id: string
          ip_address: string | null
          policy_version: string
          recorded_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          granted: boolean
          id?: string
          ip_address?: string | null
          policy_version?: string
          recorded_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          policy_version?: string
          recorded_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vin_decode_cache: {
        Row: {
          body_style: string | null
          cached_at: string
          drivetrain: string | null
          engine_spec: string | null
          expires_at: string
          fuel_type: string | null
          make: string | null
          model: string | null
          provider: string
          raw_payload: Json
          transmission: string | null
          trim: string | null
          vin: string
          year: number | null
        }
        Insert: {
          body_style?: string | null
          cached_at?: string
          drivetrain?: string | null
          engine_spec?: string | null
          expires_at?: string
          fuel_type?: string | null
          make?: string | null
          model?: string | null
          provider?: string
          raw_payload?: Json
          transmission?: string | null
          trim?: string | null
          vin: string
          year?: number | null
        }
        Update: {
          body_style?: string | null
          cached_at?: string
          drivetrain?: string | null
          engine_spec?: string | null
          expires_at?: string
          fuel_type?: string | null
          make?: string | null
          model?: string | null
          provider?: string
          raw_payload?: Json
          transmission?: string | null
          trim?: string | null
          vin?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_analytics_dealer_leaderboard: {
        Row: {
          city: string | null
          dealership_id: string | null
          legal_name: string | null
          license_number: string | null
          lots_won: number | null
          operating_name: string | null
          province: string | null
          regulator: string | null
          total_bids_placed: number | null
          volume_cents: number | null
        }
        Relationships: []
      }
      admin_analytics_metro_velocity: {
        Row: {
          city: string | null
          clearance_percent: number | null
          cleared_lots: number | null
          intake_lots: number | null
          province: string | null
        }
        Relationships: []
      }
      admin_analytics_provincial_summary: {
        Row: {
          avg_bids_per_listing: number | null
          avg_surplus_cents: number | null
          cleared_lots_count: number | null
          code: string | null
          gmv_cents: number | null
          province_name: string | null
          regulator: string | null
          total_listings_count: number | null
          verified_dealers_count: number | null
        }
        Relationships: []
      }
      admin_analytics_settlement_ledger: {
        Row: {
          agreed_amount_cents: number | null
          buyer_name: string | null
          city: string | null
          dealership_id: string | null
          id: string | null
          listing_id: string | null
          outcome: string | null
          province: string | null
          regulator_ref: string | null
          reserve_price_cents: number | null
          seller_id: string | null
          settled_at: string | null
          settlement_amount_cents: number | null
          settlement_status: string | null
          surplus_cents: number | null
          vehicle_title: string | null
          vin: string | null
          voucher_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "admin_analytics_dealer_leaderboard"
            referencedColumns: ["dealership_id"]
          },
          {
            foreignKeyName: "matches_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "public_auction_telemetry"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "matches_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_auction_telemetry: {
        Row: {
          auction_ends_at: string | null
          auction_started_at: string | null
          bid_count: number | null
          closed_at: string | null
          listing_id: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
        }
        Insert: {
          auction_ends_at?: string | null
          auction_started_at?: string | null
          bid_count?: number | null
          closed_at?: string | null
          listing_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
        }
        Update: {
          auction_ends_at?: string | null
          auction_started_at?: string | null
          bid_count?: number | null
          closed_at?: string | null
          listing_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_dealer_bid: {
        Args: {
          p_bid_id: string
          p_listing_id: string
          p_selection_reason?: string
        }
        Returns: Json
      }
      compute_audit_entry_hash: {
        Args: {
          p_action: string
          p_actor_name: string
          p_actor_role: string
          p_after_json: Json
          p_before_json: Json
          p_created_at: string
          p_details: string
          p_entity_id: string
          p_entity_type: string
          p_id: number
          p_ip_address: string
          p_jurisdiction: string
          p_prev_hash: string
        }
        Returns: string
      }
      get_admin_platform_analytics: {
        Args: { p_province?: string; p_range?: string }
        Returns: Json
      }
      get_dealer_inventory_with_distance: {
        Args: {
          p_damage_grade?: string
          p_dealership_id: string
          p_make?: string
          p_max_distance_km?: number
          p_max_mileage_km?: number
          p_province?: string
          p_search?: string
          p_sort_by?: string
        }
        Returns: {
          auction_ends_at: string
          bid_count: number
          body_type: string
          carfax_clean: boolean
          city: string
          damage_grade: string
          damage_hotspot_count: number
          distance_km: number
          drivetrain: string
          exterior_color: string
          has_lien: boolean
          has_reserve: boolean
          id: string
          interior_color: string
          keys_count: number
          make: string
          mileage_km: number
          model: string
          my_current_bid_cents: number
          postal_code: string
          province: string
          transmission: string
          vehicle_trim: string
          vin: string
          year: number
        }[]
      }
      get_dealership_listing_distances: {
        Args: { p_dealership_id: string; p_listing_ids: string[] }
        Returns: {
          distance_km: number
          listing_id: string
        }[]
      }
      get_unsealed_bid_distances: {
        Args: { p_listing_id: string }
        Returns: {
          dealership_id: string
          distance_km: number
        }[]
      }
      submit_dealer_bid: {
        Args: {
          p_amount_cents: number
          p_conditions?: string
          p_idempotency_key: string
          p_listing_id: string
          p_notes?: string
        }
        Returns: Json
      }
      transition_dealership_status_and_void_bids: {
        Args: {
          p_admin_id: string
          p_dealership_id: string
          p_new_status: Database["public"]["Enums"]["dealership_status"]
          p_notes?: string
        }
        Returns: Json
      }
      verify_audit_log_chain: { Args: never; Returns: Json }
    }
    Enums: {
      bid_status: "ACTIVE" | "WON" | "LOST" | "EXPIRED" | "WITHDRAWN" | "VOIDED"
      damage_severity: "MINOR" | "MODERATE" | "SEVERE"
      dealer_seat_role: "DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR"
      dealership_status:
        | "PENDING"
        | "VERIFIED"
        | "REJECTED"
        | "SUSPENDED"
        | "REVOKED"
      dispute_category:
        | "UNDERBODY_DAMAGE"
        | "MISSING_KEYS"
        | "MECHANICAL_POWERTRAIN"
        | "ODOMETER_DISCREPANCY"
        | "UNRESOLVED_LIEN"
      dispute_status:
        | "INVESTIGATING"
        | "ACTION_REQUIRED"
        | "RESOLVED"
        | "CLOSED"
      id_doc_type: "DRIVERS_LICENCE" | "PASSPORT"
      kyc_status:
        | "NOT_STARTED"
        | "PENDING"
        | "VERIFIED"
        | "REJECTED"
        | "EXPIRED"
      listing_status:
        | "DRAFT"
        | "PENDING_MODERATION"
        | "EDITS_REQUESTED"
        | "REJECTED"
        | "ACTIVE"
        | "UNSEALED"
        | "ACCEPTED"
        | "COMPLETED"
        | "EXPIRED"
        | "CANCELLED"
      match_outcome:
        | "APPOINTMENT_CONFIRMED"
        | "COMPLETED"
        | "RENEGOTIATED_LOWER"
        | "NO_SHOW"
        | "DECLINED_AFTER_INSPECTION"
        | "EXPIRED"
      notification_type:
        | "BID"
        | "KYC"
        | "MODERATION"
        | "AUCTION"
        | "MATCH"
        | "BILLING"
        | "DISPUTE"
        | "SYSTEM"
      regulator_code: "OMVIC" | "AMVIC" | "VSA" | "OPC"
      subscription_status:
        | "ACTIVE"
        | "TRIALING"
        | "PAST_DUE"
        | "EXPIRED"
        | "CANCELLED"
      user_role: "SELLER" | "DEALER_ADMIN" | "DEALER_AGENT" | "ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      bid_status: ["ACTIVE", "WON", "LOST", "EXPIRED", "WITHDRAWN", "VOIDED"],
      damage_severity: ["MINOR", "MODERATE", "SEVERE"],
      dealer_seat_role: ["DEALER_ADMIN", "DEALER_BUYER", "DEALER_INSPECTOR"],
      dealership_status: [
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "SUSPENDED",
        "REVOKED",
      ],
      dispute_category: [
        "UNDERBODY_DAMAGE",
        "MISSING_KEYS",
        "MECHANICAL_POWERTRAIN",
        "ODOMETER_DISCREPANCY",
        "UNRESOLVED_LIEN",
      ],
      dispute_status: [
        "INVESTIGATING",
        "ACTION_REQUIRED",
        "RESOLVED",
        "CLOSED",
      ],
      id_doc_type: ["DRIVERS_LICENCE", "PASSPORT"],
      kyc_status: ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
      listing_status: [
        "DRAFT",
        "PENDING_MODERATION",
        "EDITS_REQUESTED",
        "REJECTED",
        "ACTIVE",
        "UNSEALED",
        "ACCEPTED",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
      ],
      match_outcome: [
        "APPOINTMENT_CONFIRMED",
        "COMPLETED",
        "RENEGOTIATED_LOWER",
        "NO_SHOW",
        "DECLINED_AFTER_INSPECTION",
        "EXPIRED",
      ],
      notification_type: [
        "BID",
        "KYC",
        "MODERATION",
        "AUCTION",
        "MATCH",
        "BILLING",
        "DISPUTE",
        "SYSTEM",
      ],
      regulator_code: ["OMVIC", "AMVIC", "VSA", "OPC"],
      subscription_status: [
        "ACTIVE",
        "TRIALING",
        "PAST_DUE",
        "EXPIRED",
        "CANCELLED",
      ],
      user_role: ["SELLER", "DEALER_ADMIN", "DEALER_AGENT", "ADMIN"],
    },
  },
} as const

