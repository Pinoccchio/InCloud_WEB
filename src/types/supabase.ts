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
      admins: {
        Row: {
          branches: Json | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          branches?: Json | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          branches?: Json | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          branch_id: string | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at: string | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          branch_id?: string | null
          conditions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          branch_id?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_settings: {
        Row: {
          branch_id: string | null
          created_at: string | null
          critical_expiry_days: number | null
          critical_stock_threshold: number | null
          email_notifications: boolean | null
          expiry_warning_days: number | null
          id: string
          in_app_notifications: boolean | null
          low_stock_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          critical_expiry_days?: number | null
          critical_stock_threshold?: number | null
          email_notifications?: boolean | null
          expiry_warning_days?: number | null
          id?: string
          in_app_notifications?: boolean | null
          low_stock_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          critical_expiry_days?: number | null
          critical_stock_threshold?: number | null
          email_notifications?: boolean | null
          expiry_warning_days?: number | null
          id?: string
          in_app_notifications?: boolean | null
          low_stock_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_reports: {
        Row: {
          branch_id: string | null
          chart_data: Json | null
          created_at: string | null
          data: Json
          description: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          insights: string | null
          is_automated: boolean | null
          parameters: Json | null
          report_type: string
          status: string | null
          title: string
          valid_until: string | null
        }
        Insert: {
          branch_id?: string | null
          chart_data?: Json | null
          created_at?: string | null
          data: Json
          description?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          insights?: string | null
          is_automated?: boolean | null
          parameters?: Json | null
          report_type: string
          status?: string | null
          title: string
          valid_until?: string | null
        }
        Update: {
          branch_id?: string | null
          chart_data?: Json | null
          created_at?: string | null
          data?: Json
          description?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          insights?: string | null
          is_automated?: boolean | null
          parameters?: Json | null
          report_type?: string
          status?: string | null
          title?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          admin_id: string | null
          change_context: string | null
          change_summary: string | null
          created_at: string | null
          field_changes: Json | null
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          admin_id?: string | null
          change_context?: string | null
          change_summary?: string | null
          created_at?: string | null
          field_changes?: Json | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          admin_id?: string | null
          change_context?: string | null
          change_summary?: string | null
          created_at?: string | null
          field_changes?: Json | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_order_fulfillments: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          order_item_id: string | null
          quantity_fulfilled: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          order_item_id?: string | null
          quantity_fulfilled: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          order_item_id?: string | null
          quantity_fulfilled?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_order_fulfillments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_order_fulfillments_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          contact_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: Json | null
          created_at: string | null
          customer_type: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          preferred_branch_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          customer_type?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          preferred_branch_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          customer_type?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          preferred_branch_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_preferred_branch_id_fkey"
            columns: ["preferred_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecast: {
        Row: {
          accuracy_score: number | null
          actual_demand: number | null
          branch_id: string
          confidence_level: number | null
          created_at: string | null
          factors: Json | null
          forecast_date: string
          id: string
          model_version: string | null
          predicted_demand: number
          product_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_demand?: number | null
          branch_id: string
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          forecast_date: string
          id?: string
          model_version?: string | null
          predicted_demand: number
          product_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_demand?: number | null
          branch_id?: string
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          forecast_date?: string
          id?: string
          model_version?: string | null
          predicted_demand?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecast_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecast_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available_quantity: number | null
          branch_id: string
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          id: string
          last_restock_date: string | null
          location: string | null
          low_stock_threshold: number | null
          min_stock_level: number | null
          product_id: string
          quantity: number
          reserved_quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          available_quantity?: number | null
          branch_id: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_restock_date?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          min_stock_level?: number | null
          product_id: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          available_quantity?: number | null
          branch_id?: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_restock_date?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          min_stock_level?: number | null
          product_id?: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_snapshots: {
        Row: {
          available_quantity: number
          branch_id: string
          created_at: string | null
          id: string
          inventory_id: string
          max_stock_level: number | null
          min_stock_level: number | null
          product_id: string
          quantity: number
          reserved_quantity: number | null
          snapshot_date: string
          value_at_cost: number | null
          value_at_retail: number | null
        }
        Insert: {
          available_quantity: number
          branch_id: string
          created_at?: string | null
          id?: string
          inventory_id: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id: string
          quantity: number
          reserved_quantity?: number | null
          snapshot_date: string
          value_at_cost?: number | null
          value_at_retail?: number | null
        }
        Update: {
          available_quantity?: number
          branch_id?: string
          created_at?: string | null
          id?: string
          inventory_id?: string
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id?: string
          quantity?: number
          reserved_quantity?: number | null
          snapshot_date?: string
          value_at_cost?: number | null
          value_at_retail?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          admin_id: string | null
          backup_notifications: boolean | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          critical_expiry_days: number | null
          critical_stock_threshold: number | null
          email_notifications: boolean | null
          expiry_alerts_enabled: boolean | null
          expiry_warning_days: number | null
          group_similar_notifications: boolean | null
          id: string
          low_stock_threshold: number | null
          notification_frequency: string | null
          order_created_notifications: boolean | null
          order_delivery_notifications: boolean | null
          order_payment_notifications: boolean | null
          order_status_change_notifications: boolean | null
          push_notifications: boolean | null
          security_notifications: boolean | null
          sms_notifications: boolean | null
          stock_alerts_enabled: boolean | null
          system_maintenance_notifications: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          admin_id?: string | null
          backup_notifications?: boolean | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          critical_expiry_days?: number | null
          critical_stock_threshold?: number | null
          email_notifications?: boolean | null
          expiry_alerts_enabled?: boolean | null
          expiry_warning_days?: number | null
          group_similar_notifications?: boolean | null
          id?: string
          low_stock_threshold?: number | null
          notification_frequency?: string | null
          order_created_notifications?: boolean | null
          order_delivery_notifications?: boolean | null
          order_payment_notifications?: boolean | null
          order_status_change_notifications?: boolean | null
          push_notifications?: boolean | null
          security_notifications?: boolean | null
          sms_notifications?: boolean | null
          stock_alerts_enabled?: boolean | null
          system_maintenance_notifications?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          admin_id?: string | null
          backup_notifications?: boolean | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          critical_expiry_days?: number | null
          critical_stock_threshold?: number | null
          email_notifications?: boolean | null
          expiry_alerts_enabled?: boolean | null
          expiry_warning_days?: number | null
          group_similar_notifications?: boolean | null
          id?: string
          low_stock_threshold?: number | null
          notification_frequency?: string | null
          order_created_notifications?: boolean | null
          order_delivery_notifications?: boolean | null
          order_payment_notifications?: boolean | null
          order_status_change_notifications?: boolean | null
          push_notifications?: boolean | null
          security_notifications?: boolean | null
          sms_notifications?: boolean | null
          stock_alerts_enabled?: boolean | null
          system_maintenance_notifications?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_url: string | null
          admin_is_read: boolean | null
          branch_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_acknowledged: boolean
          is_read: boolean
          is_resolved: boolean
          message: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_url?: string | null
          admin_is_read?: boolean | null
          branch_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          is_resolved?: boolean
          message: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_url?: string | null
          admin_is_read?: boolean | null
          branch_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          is_resolved?: boolean
          message?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      order_fulfillment: {
        Row: {
          created_at: string | null
          customer_signature: string | null
          delivered_by: string | null
          delivery_notes: string | null
          delivery_time: string | null
          id: string
          order_id: string
          packed_by: string | null
          picked_by: string | null
          pickup_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_signature?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          id?: string
          order_id: string
          packed_by?: string | null
          picked_by?: string | null
          pickup_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_signature?: string | null
          delivered_by?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          id?: string
          order_id?: string
          packed_by?: string | null
          picked_by?: string | null
          pickup_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_fulfillment_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillment_packed_by_fkey"
            columns: ["packed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillment_picked_by_fkey"
            columns: ["picked_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          fulfillment_status: string | null
          id: string
          order_id: string
          pricing_type: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          order_id: string
          pricing_type: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          order_id?: string
          pricing_type?: Database["public"]["Enums"]["pricing_tier"]
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          changed_by_user_id: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_at?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_at?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_to: string | null
          branch_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by_user_id: string | null
          customer_id: string | null
          delivery_address: Json | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          proof_of_payment_status: string | null
          proof_of_payment_url: string | null
          proof_rejection_reason: string | null
          proof_reviewed_at: string | null
          proof_reviewed_by: string | null
          proof_submitted_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          branch_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          proof_of_payment_status?: string | null
          proof_of_payment_url?: string | null
          proof_rejection_reason?: string | null
          proof_reviewed_at?: string | null
          proof_reviewed_by?: string | null
          proof_submitted_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          proof_of_payment_status?: string | null
          proof_of_payment_url?: string | null
          proof_rejection_reason?: string | null
          proof_reviewed_at?: string | null
          proof_reviewed_by?: string | null
          proof_submitted_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_proof_reviewed_by_fkey"
            columns: ["proof_reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_kpis: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          kpi_date: string
          kpi_type: string
          kpi_value: number
          metadata: Json | null
          performance_grade: string | null
          target_value: number | null
          variance_percentage: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          kpi_date: string
          kpi_type: string
          kpi_value: number
          metadata?: Json | null
          performance_grade?: string | null
          target_value?: number | null
          variance_percentage?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          kpi_date?: string
          kpi_type?: string
          kpi_value?: number
          metadata?: Json | null
          performance_grade?: string | null
          target_value?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_kpis_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tiers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          price: number
          pricing_type: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price: number
          pricing_type: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price?: number
          pricing_type?: Database["public"]["Enums"]["pricing_tier"]
          product_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_tiers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          expiration_date: string
          id: string
          inventory_id: string
          is_active: boolean | null
          quantity: number
          received_date: string | null
          status: string | null
          supplier_info: Json | null
          supplier_name: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          batch_number: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          expiration_date: string
          id?: string
          inventory_id: string
          is_active?: boolean | null
          quantity: number
          received_date?: string | null
          status?: string | null
          supplier_info?: Json | null
          supplier_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          batch_number?: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string
          id?: string
          inventory_id?: string
          is_active?: boolean | null
          quantity?: number
          received_date?: string | null
          status?: string | null
          supplier_info?: Json | null
          supplier_name?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          images: Json | null
          low_stock_threshold: number | null
          name: string
          product_id: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          low_stock_threshold?: number | null
          name: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          low_stock_threshold?: number | null
          name?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_history: {
        Row: {
          batch_id: string | null
          cost_per_unit: number
          created_at: string | null
          id: string
          inventory_id: string | null
          notes: string | null
          performed_by: string | null
          purchase_order_ref: string | null
          quantity: number
          received_date: string | null
          supplier_info: Json | null
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          cost_per_unit: number
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          performed_by?: string | null
          purchase_order_ref?: string | null
          quantity: number
          received_date?: string | null
          supplier_info?: Json | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          cost_per_unit?: number
          created_at?: string | null
          id?: string
          inventory_id?: string | null
          notes?: string | null
          performed_by?: string | null
          purchase_order_ref?: string | null
          quantity?: number
          received_date?: string | null
          supplier_info?: Json | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_metrics: {
        Row: {
          average_order_value: number | null
          branch_id: string | null
          category_id: string | null
          created_at: string | null
          id: string
          metric_date: string
          product_id: string | null
          profit_margin: number | null
          top_selling_tier: Database["public"]["Enums"]["pricing_tier"] | null
          total_orders: number | null
          total_quantity_sold: number | null
          total_revenue: number | null
        }
        Insert: {
          average_order_value?: number | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metric_date: string
          product_id?: string | null
          profit_margin?: number | null
          top_selling_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          total_orders?: number | null
          total_quantity_sold?: number | null
          total_revenue?: number | null
        }
        Update: {
          average_order_value?: number | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metric_date?: string
          product_id?: string | null
          profit_margin?: number | null
          top_selling_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          total_orders?: number | null
          total_quantity_sold?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_metrics_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_metrics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_by: string | null
          created_at: string | null
          from_branch_id: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          received_date: string | null
          requested_by: string
          sent_date: string | null
          status: string | null
          to_branch_id: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          from_branch_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          received_date?: string | null
          requested_by: string
          sent_date?: string | null
          status?: string | null
          to_branch_id: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          from_branch_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          received_date?: string | null
          requested_by?: string
          sent_date?: string | null
          status?: string | null
          to_branch_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          admin_id: string
          auto_reorder: boolean | null
          created_at: string | null
          currency_format: string | null
          dashboard_layout: Json | null
          date_format: string | null
          decimal_places: number | null
          default_date_range: string | null
          default_pricing_tier:
            | Database["public"]["Enums"]["pricing_tier"]
            | null
          enable_fifo: boolean | null
          expiry_warning_days: number | null
          export_format: string | null
          id: string
          include_images: boolean | null
          language: string | null
          low_stock_threshold: number | null
          phone: string | null
          profile_picture_url: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          auto_reorder?: boolean | null
          created_at?: string | null
          currency_format?: string | null
          dashboard_layout?: Json | null
          date_format?: string | null
          decimal_places?: number | null
          default_date_range?: string | null
          default_pricing_tier?:
            | Database["public"]["Enums"]["pricing_tier"]
            | null
          enable_fifo?: boolean | null
          expiry_warning_days?: number | null
          export_format?: string | null
          id?: string
          include_images?: boolean | null
          language?: string | null
          low_stock_threshold?: number | null
          phone?: string | null
          profile_picture_url?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          auto_reorder?: boolean | null
          created_at?: string | null
          currency_format?: string | null
          dashboard_layout?: Json | null
          date_format?: string | null
          decimal_places?: number | null
          default_date_range?: string | null
          default_pricing_tier?:
            | Database["public"]["Enums"]["pricing_tier"]
            | null
          enable_fifo?: boolean | null
          expiry_warning_days?: number | null
          export_format?: string | null
          id?: string
          include_images?: boolean | null
          language?: string | null
          low_stock_threshold?: number | null
          phone?: string | null
          profile_picture_url?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      admin_role: "admin" | "super_admin"
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_type:
        | "low_stock"
        | "expiring_soon"
        | "expired"
        | "out_of_stock"
        | "overstock"
        | "order_status"
        | "system"
      audit_action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "password_change"
        | "permission_grant"
        | "permission_revoke"
      notification_severity: "low" | "medium" | "high" | "critical"
      notification_type:
        | "order"
        | "alert"
        | "system"
        | "inventory"
        | "expiration"
        | "stock"
        | "delivery"
        | "payment"
        | "security"
        | "maintenance"
      order_status:
        | "pending"
        | "confirmed"
        | "in_transit"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_status: "pending" | "paid" | "partial" | "refunded" | "cancelled"
      pricing_tier: "wholesale" | "retail" | "bulk"
      product_status:
        | "active"
        | "inactive"
        | "discontinued"
        | "available"
        | "unavailable"
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
