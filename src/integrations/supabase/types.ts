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
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          pincode: string | null
          state: string
          type: string
          updated_at: string
          user_id: string
          zipcode: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          pincode?: string | null
          state: string
          type?: string
          updated_at?: string
          user_id: string
          zipcode?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          pincode?: string | null
          state?: string
          type?: string
          updated_at?: string
          user_id?: string
          zipcode?: string | null
        }
        Relationships: []
      }
      cxbc_booking_drafts: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_pincode: string | null
          customer_state: string | null
          declared_value: number | null
          destination_country: string | null
          expires_at: string
          id: string
          notes: string | null
          partner_id: string
          payment_method: string | null
          profit_margin: number | null
          shipment_type: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          declared_value?: number | null
          destination_country?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_method?: string | null
          profit_margin?: number | null
          shipment_type: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_pincode?: string | null
          customer_state?: string | null
          declared_value?: number | null
          destination_country?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_method?: string | null
          profit_margin?: number | null
          shipment_type?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cxbc_booking_drafts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "cxbc_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      cxbc_customer_bills: {
        Row: {
          base_cost: number
          bill_number: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          gst_amount: number
          id: string
          partner_id: string
          partner_margin: number
          payment_method: string
          shipment_id: string | null
          total_amount: number
        }
        Insert: {
          base_cost: number
          bill_number: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          gst_amount?: number
          id?: string
          partner_id: string
          partner_margin?: number
          payment_method?: string
          shipment_id?: string | null
          total_amount: number
        }
        Update: {
          base_cost?: number
          bill_number?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          gst_amount?: number
          id?: string
          partner_id?: string
          partner_margin?: number
          payment_method?: string
          shipment_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "cxbc_customer_bills_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "cxbc_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cxbc_customer_bills_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      cxbc_partner_applications: {
        Row: {
          address: string
          business_name: string
          city: string
          created_at: string
          email: string
          gst_number: string | null
          id: string
          kyc_aadhaar_url: string | null
          kyc_pan_url: string | null
          owner_name: string
          pan_number: string
          phone: string
          pincode: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_photo_url: string | null
          state: string
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string | null
          zone: Database["public"]["Enums"]["india_zone"]
        }
        Insert: {
          address: string
          business_name: string
          city: string
          created_at?: string
          email: string
          gst_number?: string | null
          id?: string
          kyc_aadhaar_url?: string | null
          kyc_pan_url?: string | null
          owner_name: string
          pan_number: string
          phone: string
          pincode: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_photo_url?: string | null
          state: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
          zone: Database["public"]["Enums"]["india_zone"]
        }
        Update: {
          address?: string
          business_name?: string
          city?: string
          created_at?: string
          email?: string
          gst_number?: string | null
          id?: string
          kyc_aadhaar_url?: string | null
          kyc_pan_url?: string | null
          owner_name?: string
          pan_number?: string
          phone?: string
          pincode?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_photo_url?: string | null
          state?: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string | null
          zone?: Database["public"]["Enums"]["india_zone"]
        }
        Relationships: []
      }
      cxbc_partner_employees: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          partner_id: string
          permissions: Json
          phone: string | null
          role: Database["public"]["Enums"]["employee_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          partner_id: string
          permissions?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          partner_id?: string
          permissions?: Json
          phone?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cxbc_partner_employees_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "cxbc_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      cxbc_partners: {
        Row: {
          address: string
          approved_at: string | null
          approved_by: string | null
          business_name: string
          city: string
          created_at: string
          default_sender_email: string | null
          default_sender_name: string | null
          default_sender_phone: string | null
          email: string
          gst_number: string | null
          id: string
          kyc_aadhaar_url: string | null
          kyc_pan_url: string | null
          owner_name: string
          pan_number: string
          phone: string
          pincode: string
          profit_margin_percent: number
          rejection_reason: string | null
          shop_photo_url: string | null
          state: string
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string
          wallet_balance: number
          zone: Database["public"]["Enums"]["india_zone"]
        }
        Insert: {
          address: string
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          city: string
          created_at?: string
          default_sender_email?: string | null
          default_sender_name?: string | null
          default_sender_phone?: string | null
          email: string
          gst_number?: string | null
          id?: string
          kyc_aadhaar_url?: string | null
          kyc_pan_url?: string | null
          owner_name: string
          pan_number: string
          phone: string
          pincode: string
          profit_margin_percent?: number
          rejection_reason?: string | null
          shop_photo_url?: string | null
          state: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id: string
          wallet_balance?: number
          zone: Database["public"]["Enums"]["india_zone"]
        }
        Update: {
          address?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          city?: string
          created_at?: string
          default_sender_email?: string | null
          default_sender_name?: string | null
          default_sender_phone?: string | null
          email?: string
          gst_number?: string | null
          id?: string
          kyc_aadhaar_url?: string | null
          kyc_pan_url?: string | null
          owner_name?: string
          pan_number?: string
          phone?: string
          pincode?: string
          profit_margin_percent?: number
          rejection_reason?: string | null
          shop_photo_url?: string | null
          state?: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string
          wallet_balance?: number
          zone?: Database["public"]["Enums"]["india_zone"]
        }
        Relationships: []
      }
      dispatch_manifests: {
        Row: {
          carrier: string
          created_at: string | null
          created_by: string | null
          dispatched_at: string | null
          id: string
          manifest_number: string
          shipment_count: number | null
        }
        Insert: {
          carrier: string
          created_at?: string | null
          created_by?: string | null
          dispatched_at?: string | null
          id?: string
          manifest_number: string
          shipment_count?: number | null
        }
        Update: {
          carrier?: string
          created_at?: string | null
          created_by?: string | null
          dispatched_at?: string | null
          id?: string
          manifest_number?: string
          shipment_count?: number | null
        }
        Relationships: []
      }
      domestic_tracking_logs: {
        Row: {
          id: string
          location: string | null
          shipment_id: string
          status: string
          timestamp: string | null
        }
        Insert: {
          id?: string
          location?: string | null
          shipment_id: string
          status: string
          timestamp?: string | null
        }
        Update: {
          id?: string
          location?: string | null
          shipment_id?: string
          status?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domestic_tracking_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          description: string
          gst_amount: number
          id: string
          invoice_number: string
          paid_at: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          gst_amount?: number
          id?: string
          invoice_number: string
          paid_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          gst_amount?: number
          id?: string
          invoice_number?: string
          paid_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      manifest_items: {
        Row: {
          id: string
          manifest_id: string
          shipment_id: string
        }
        Insert: {
          id?: string
          manifest_id: string
          shipment_id: string
        }
        Update: {
          id?: string
          manifest_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifest_items_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "dispatch_manifests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manifest_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_address: string | null
          aadhaar_verified: boolean | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          kyc_completed_at: string | null
          notifications_email: boolean | null
          notifications_promotional: boolean | null
          notifications_whatsapp: boolean | null
          phone_number: string | null
          preferred_currency: string | null
          preferred_language: string | null
          preferred_otp_method: string | null
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          aadhaar_address?: string | null
          aadhaar_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kyc_completed_at?: string | null
          notifications_email?: boolean | null
          notifications_promotional?: boolean | null
          notifications_whatsapp?: boolean | null
          phone_number?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          preferred_otp_method?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          aadhaar_address?: string | null
          aadhaar_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kyc_completed_at?: string | null
          notifications_email?: boolean | null
          notifications_promotional?: boolean | null
          notifications_whatsapp?: boolean | null
          phone_number?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          preferred_otp_method?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      qc_checklists: {
        Row: {
          actual_unit_count: number | null
          bill_date_valid: boolean | null
          bill_patient_match: boolean | null
          created_at: string | null
          daily_dosage: number | null
          days_supply_calculated: number | null
          days_supply_compliant: boolean | null
          decision: string | null
          dimensions_height_cm: number | null
          dimensions_length_cm: number | null
          dimensions_width_cm: number | null
          final_weight_kg: number | null
          id: string
          is_narcotic: boolean | null
          operator_id: string
          passport_name_match: boolean | null
          prescription_patient_match: boolean | null
          rejection_reason: string | null
          shipment_id: string
          updated_at: string | null
        }
        Insert: {
          actual_unit_count?: number | null
          bill_date_valid?: boolean | null
          bill_patient_match?: boolean | null
          created_at?: string | null
          daily_dosage?: number | null
          days_supply_calculated?: number | null
          days_supply_compliant?: boolean | null
          decision?: string | null
          dimensions_height_cm?: number | null
          dimensions_length_cm?: number | null
          dimensions_width_cm?: number | null
          final_weight_kg?: number | null
          id?: string
          is_narcotic?: boolean | null
          operator_id: string
          passport_name_match?: boolean | null
          prescription_patient_match?: boolean | null
          rejection_reason?: string | null
          shipment_id: string
          updated_at?: string | null
        }
        Update: {
          actual_unit_count?: number | null
          bill_date_valid?: boolean | null
          bill_patient_match?: boolean | null
          created_at?: string | null
          daily_dosage?: number | null
          days_supply_calculated?: number | null
          days_supply_compliant?: boolean | null
          decision?: string | null
          dimensions_height_cm?: number | null
          dimensions_length_cm?: number | null
          dimensions_width_cm?: number | null
          final_weight_kg?: number | null
          id?: string
          is_narcotic?: boolean | null
          operator_id?: string
          passport_name_match?: boolean | null
          prescription_patient_match?: boolean | null
          rejection_reason?: string | null
          shipment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qc_checklists_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_documents: {
        Row: {
          document_type: string
          file_url: string
          id: string
          shipment_id: string
          uploaded_at: string | null
        }
        Insert: {
          document_type: string
          file_url: string
          id?: string
          shipment_id: string
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string
          file_url?: string
          id?: string
          shipment_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_weight_kg: number | null
          created_at: string
          cxbc_partner_id: string | null
          declared_value: number
          destination_address: string
          destination_country: string
          dimensions_height_cm: number | null
          dimensions_length_cm: number | null
          dimensions_width_cm: number | null
          domestic_carrier: string | null
          domestic_label_url: string | null
          domestic_pickup_token: string | null
          domestic_tracking_id: string | null
          gst_amount: number
          id: string
          international_awb: string | null
          notes: string | null
          origin_address: string
          pickup_scheduled_date: string | null
          qc_completed_at: string | null
          qc_notes: string | null
          qc_operator_id: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipping_cost: number
          source: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
          weight_difference_charge: number | null
          weight_kg: number | null
        }
        Insert: {
          actual_weight_kg?: number | null
          created_at?: string
          cxbc_partner_id?: string | null
          declared_value?: number
          destination_address: string
          destination_country: string
          dimensions_height_cm?: number | null
          dimensions_length_cm?: number | null
          dimensions_width_cm?: number | null
          domestic_carrier?: string | null
          domestic_label_url?: string | null
          domestic_pickup_token?: string | null
          domestic_tracking_id?: string | null
          gst_amount?: number
          id?: string
          international_awb?: string | null
          notes?: string | null
          origin_address: string
          pickup_scheduled_date?: string | null
          qc_completed_at?: string | null
          qc_notes?: string | null
          qc_operator_id?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipping_cost?: number
          source?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          weight_difference_charge?: number | null
          weight_kg?: number | null
        }
        Update: {
          actual_weight_kg?: number | null
          created_at?: string
          cxbc_partner_id?: string | null
          declared_value?: number
          destination_address?: string
          destination_country?: string
          dimensions_height_cm?: number | null
          dimensions_length_cm?: number | null
          dimensions_width_cm?: number | null
          domestic_carrier?: string | null
          domestic_label_url?: string | null
          domestic_pickup_token?: string | null
          domestic_tracking_id?: string | null
          gst_amount?: number
          id?: string
          international_awb?: string | null
          notes?: string | null
          origin_address?: string
          pickup_scheduled_date?: string | null
          qc_completed_at?: string | null
          qc_notes?: string | null
          qc_operator_id?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          shipment_type?: Database["public"]["Enums"]["shipment_type"]
          shipping_cost?: number
          source?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          weight_difference_charge?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_cxbc_partner_id_fkey"
            columns: ["cxbc_partner_id"]
            isOneToOne: false
            referencedRelation: "cxbc_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          description: string
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          description?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_from_support: boolean
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_from_support?: boolean
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_from_support?: boolean
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_cxbc_partner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "warehouse_operator" | "user" | "cxbc_partner"
      employee_role: "manager" | "operator"
      india_zone: "north" | "south" | "east" | "west" | "central" | "northeast"
      invoice_status: "paid" | "pending" | "refunded"
      partner_status:
        | "pending"
        | "under_review"
        | "approved"
        | "suspended"
        | "rejected"
      shipment_status:
        | "draft"
        | "confirmed"
        | "picked_up"
        | "at_warehouse"
        | "qc_passed"
        | "qc_failed"
        | "in_transit"
        | "customs_clearance"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "payment_received"
        | "pickup_scheduled"
        | "out_for_pickup"
        | "qc_in_progress"
        | "pending_payment"
        | "dispatched"
      shipment_type: "medicine" | "document" | "gift"
      ticket_category:
        | "shipment"
        | "payment"
        | "kyc"
        | "refund"
        | "qc_failure"
        | "customs"
        | "general"
        | "complaint"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "awaiting_response"
        | "resolved"
        | "closed"
        | "escalated"
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
      app_role: ["admin", "warehouse_operator", "user", "cxbc_partner"],
      employee_role: ["manager", "operator"],
      india_zone: ["north", "south", "east", "west", "central", "northeast"],
      invoice_status: ["paid", "pending", "refunded"],
      partner_status: [
        "pending",
        "under_review",
        "approved",
        "suspended",
        "rejected",
      ],
      shipment_status: [
        "draft",
        "confirmed",
        "picked_up",
        "at_warehouse",
        "qc_passed",
        "qc_failed",
        "in_transit",
        "customs_clearance",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "payment_received",
        "pickup_scheduled",
        "out_for_pickup",
        "qc_in_progress",
        "pending_payment",
        "dispatched",
      ],
      shipment_type: ["medicine", "document", "gift"],
      ticket_category: [
        "shipment",
        "payment",
        "kyc",
        "refund",
        "qc_failure",
        "customs",
        "general",
        "complaint",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "awaiting_response",
        "resolved",
        "closed",
        "escalated",
      ],
    },
  },
} as const
