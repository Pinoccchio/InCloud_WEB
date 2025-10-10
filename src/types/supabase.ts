export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          name: string
          sku: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          unit_of_measure: string | null
          updated_at: string | null
          updated_by: string | null
        }
      }
    }
    Enums: {
      pricing_tier: "wholesale" | "retail" | "box" | "bulk"
      product_status: "active" | "inactive" | "discontinued"
    }
  }
}
