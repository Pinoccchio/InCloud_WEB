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
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          auto_generated: boolean | null
          batch_id: string | null
          branch_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          inventory_id: string | null
          is_acknowledged: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          order_id: string | null
          product_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_generated?: boolean | null
          batch_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inventory_id?: string | null
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_generated?: boolean | null
          batch_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inventory_id?: string | null
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
          id: string
          last_counted_date: string | null
          last_restock_date: string | null
          location: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          product_id: string
          quantity: number
          reserved_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          branch_id: string
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          last_counted_date?: string | null
          last_restock_date?: string | null
          location?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          branch_id?: string
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          last_counted_date?: string | null
          last_restock_date?: string | null
          location?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id?: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
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
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          admin_id: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string | null
          email_notifications: boolean | null
          enabled: boolean | null
          id: string
          min_severity: Database["public"]["Enums"]["alert_severity"] | null
          push_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string | null
          email_notifications?: boolean | null
          enabled?: boolean | null
          id?: string
          min_severity?: Database["public"]["Enums"]["alert_severity"] | null
          push_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string | null
          email_notifications?: boolean | null
          enabled?: boolean | null
          id?: string
          min_severity?: Database["public"]["Enums"]["alert_severity"] | null
          push_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_admin_id_fkey"
            columns: ["admin_id"]
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
          id: string
          order_id: string
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          pricing_tier?: Database["public"]["Enums"]["pricing_tier"]
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
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          delivery_address: Json | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
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
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
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
          id: string
          is_active: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          price: number
          product_id: string
          tier_type: Database["public"]["Enums"]["pricing_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price: number
          product_id: string
          tier_type: Database["public"]["Enums"]["pricing_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number | null
          price?: number
          product_id?: string
          tier_type?: Database["public"]["Enums"]["pricing_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          expiration_date: string
          id: string
          inventory_id: string
          quantity: number
          received_date: string | null
          status: string | null
          supplier_info: Json | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          expiration_date: string
          id?: string
          inventory_id: string
          quantity: number
          received_date?: string | null
          status?: string | null
          supplier_info?: Json | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          expiration_date?: string
          id?: string
          inventory_id?: string
          quantity?: number
          received_date?: string | null
          status?: string | null
          supplier_info?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          brand_id: string | null
          category: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          images: Json | null
          is_frozen: boolean | null
          name: string
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_frozen?: boolean | null
          name: string
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_frozen?: boolean | null
          name?: string
          sku?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_alert: {
        Args: { p_alert_id: string }
        Returns: boolean
      }
      calculate_order_totals: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      calculate_sales_metrics: {
        Args: { p_date?: string }
        Returns: number
      }
      create_admin_profile: {
        Args: {
          p_branches?: Json
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: string
      }
      create_admin_profile_service_role: {
        Args: {
          p_branches: Json
          p_current_admin_id: string
          p_current_admin_role: Database["public"]["Enums"]["admin_role"]
          p_email: string
          p_full_name: string
          p_role: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: Json
      }
      create_admin_session: {
        Args: {
          p_admin_id: string
          p_expires_in?: unknown
        }
        Returns: string
      }
      create_admin_with_auth: {
        Args: {
          p_branches?: Json
          p_email: string
          p_full_name: string
          p_password: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      create_inventory_snapshot: {
        Args: { p_date?: string }
        Returns: number
      }
      create_order: {
        Args: {
          p_branch_id: string
          p_customer_id: string
          p_delivery_address?: Json
          p_notes?: string
          p_order_items: Json
        }
        Returns: string
      }
      create_product: {
        Args: {
          p_barcode?: string
          p_brand_id?: string
          p_category_id?: string
          p_description?: string
          p_is_frozen?: boolean
          p_name: string
          p_pricing_tiers?: Json
          p_sku?: string
          p_unit_of_measure?: string
        }
        Returns: string
      }
      deactivate_admin_safely: {
        Args: { p_admin_id: string }
        Returns: Json
      }
      generate_expiration_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_inventory_trend_report: {
        Args: { p_branch_id: string; p_days_back?: number }
        Returns: Json
      }
      generate_low_stock_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_dashboard_data: {
        Args: { p_branch_id?: string }
        Returns: Json
      }
      get_admin_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_branches: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_branch_access: {
        Args: { branch_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_super_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      link_auth_user_to_admin: {
        Args: {
          p_auth_user_id: string
          p_branches?: Json
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      reset_admin_password: {
        Args: { p_admin_id: string }
        Returns: Json
      }
      reset_admin_password_service_role: {
        Args: {
          p_admin_id: string
          p_current_admin_id: string
          p_current_admin_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      toggle_admin_status: {
        Args: { p_admin_id: string; p_new_status: boolean }
        Returns: Json
      }
      toggle_admin_status_service_role: {
        Args: {
          p_admin_id: string
          p_current_admin_id: string
          p_current_admin_role: Database["public"]["Enums"]["admin_role"]
          p_new_status: boolean
        }
        Returns: Json
      }
      update_admin_details: {
        Args: {
          p_admin_id: string
          p_branches?: Json
          p_email?: string
          p_full_name?: string
          p_role?: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      update_admin_details_service_role: {
        Args: {
          p_admin_id: string
          p_branches: Json
          p_current_admin_id: string
          p_current_admin_role: Database["public"]["Enums"]["admin_role"]
          p_full_name: string
          p_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: Json
      }
      update_admin_last_login: {
        Args: { p_admin_id: string }
        Returns: Json
      }
      update_admin_role_and_branches: {
        Args: {
          p_admin_id: string
          p_new_branches: Json
          p_new_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: boolean
      }
      update_inventory_level: {
        Args: {
          p_branch_id: string
          p_movement_type: string
          p_notes?: string
          p_product_id: string
          p_quantity_change: number
        }
        Returns: boolean
      }
      update_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_notes?: string
          p_order_id: string
        }
        Returns: boolean
      }
      update_product: {
        Args: {
          p_barcode?: string
          p_brand_id?: string
          p_category_id?: string
          p_description?: string
          p_name: string
          p_product_id: string
          p_sku?: string
          p_status?: Database["public"]["Enums"]["product_status"]
          p_unit_of_measure?: string
        }
        Returns: boolean
      }
      validate_admin_access: {
        Args: { p_action: string; p_resource: string }
        Returns: boolean
      }
      validate_admin_operation: {
        Args: {
          p_operation: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: boolean
      }
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
      order_status:
        | "pending"
        | "confirmed"
        | "in_transit"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_status: "pending" | "paid" | "partial" | "refunded" | "cancelled"
      pricing_tier: "wholesale" | "retail" | "box"
      product_status: "active" | "inactive" | "discontinued"
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
      admin_role: ["admin", "super_admin"],
      alert_severity: ["low", "medium", "high", "critical"],
      alert_type: [
        "low_stock",
        "expiring_soon",
        "expired",
        "out_of_stock",
        "overstock",
        "order_status",
        "system",
      ],
      audit_action: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "logout",
        "password_change",
        "permission_grant",
        "permission_revoke",
      ],
      order_status: [
        "pending",
        "confirmed",
        "in_transit",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_status: ["pending", "paid", "partial", "refunded", "cancelled"],
      pricing_tier: ["wholesale", "retail", "box"],
      product_status: ["active", "inactive", "discontinued"],
    },
  },
} as const