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
      inventory: {
        Row: {
          auto_reorder: boolean | null
          available_quantity: number | null
          branch_id: string
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          id: string
          last_counted_date: string | null
          last_restock_date: string | null
          location: string | null
          low_stock_threshold: number | null
          max_stock_level: number | null
          min_stock_level: number | null
          product_id: string
          quantity: number
          reserved_quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_reorder?: boolean | null
          available_quantity?: number | null
          branch_id: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_counted_date?: string | null
          last_restock_date?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_id: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_reorder?: boolean | null
          available_quantity?: number | null
          branch_id?: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_counted_date?: string | null
          last_restock_date?: string | null
          location?: string | null
          low_stock_threshold?: number | null
          max_stock_level?: number | null
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
      orders: {
        Row: {
          assigned_to: string | null
          branch_id: string
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
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
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
          pricing_tier: Database["public"]["Enums"]["pricing_tier"]
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
      price_tiers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          max_quantity: number | null
          min_quantity: number | null
          price: number
          product_id: string
          tier_type: Database["public"]["Enums"]["pricing_tier"]
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
          product_id: string
          tier_type: Database["public"]["Enums"]["pricing_tier"]
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
          product_id?: string
          tier_type?: Database["public"]["Enums"]["pricing_tier"]
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
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
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
          updated_by: string | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
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
          updated_by?: string | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
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
      pricing_tier: "wholesale" | "retail" | "box"
      product_status: "active" | "inactive" | "discontinued"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
