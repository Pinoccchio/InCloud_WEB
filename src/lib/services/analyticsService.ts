import { createClient } from '../supabase/client'
import { createServerClient } from '../supabase/server'
import { getMainBranchId } from '../constants/branch'

// Flag to determine if we're running server-side (API routes)
const isServer = typeof window === 'undefined'

export interface InventoryMetrics {
  totalProducts: number
  totalInventoryValue: number
  totalInventoryValueRetail: number
  lowStockItems: number
  outOfStockItems: number
  adequateStockItems: number
  averageStockLevel: number
  totalAvailableQuantity: number
  totalReservedQuantity: number
}

export interface CategoryPerformance {
  categoryName: string
  productCount: number
  totalInventory: number
  availableInventory: number
  percentageOfTotal: number
}

export interface ExpirationMetrics {
  expiringSoon7Days: number
  expiringSoon14Days: number
  expiringSoon30Days: number
  expired: number
  totalBatches: number
  criticalBatches: Array<{
    productName: string
    batchNumber: string
    expirationDate: string
    quantity: number
    daysUntilExpiry: number
  }>
}

export interface SalesMetrics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  recentOrders: Array<{
    orderNumber: string
    totalAmount: number
    status: string
    orderDate: string
    itemCount: number
  }>
}

export interface PricingTierAnalysis {
  tierType: string
  productsCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
}

export interface InventoryMovementTrend {
  date: string
  movementType: string
  totalMovements: number
  quantityChanged: number
}

export interface ProductStockStatus {
  productName: string
  categoryName: string
  brandName: string
  currentQuantity: number
  availableQuantity: number
  lowStockThreshold: number
  status: 'critical' | 'low' | 'adequate' | 'overstocked'
  daysOfStock: number
}

export class AnalyticsService {
  /**
   * Get comprehensive inventory metrics
   */
  static async getInventoryMetrics(): Promise<InventoryMetrics> {
    const supabase = createClient()

    // Get inventory data with product and pricing info
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products!inner(
          id,
          name,
          price_tiers(price, tier_type)
        )
      `)

    if (error) throw error

    const totalProducts = inventory?.length || 0
    let totalInventoryValue = 0
    let totalInventoryValueRetail = 0
    let lowStockItems = 0
    let outOfStockItems = 0
    let adequateStockItems = 0
    let totalAvailableQuantity = 0
    let totalReservedQuantity = 0

    inventory?.forEach((item: any) => {
      const quantity = item.quantity || 0
      const availableQty = item.available_quantity || 0
      const reservedQty = item.reserved_quantity || 0
      const costPerUnit = item.cost_per_unit || 0
      const lowThreshold = item.low_stock_threshold || 10

      totalAvailableQuantity += availableQty
      totalReservedQuantity += reservedQty

      // Calculate value at cost
      totalInventoryValue += quantity * costPerUnit

      // Calculate value at retail (using retail pricing tier)
      const retailPrice = item.products?.price_tiers?.find(
        (pt: any) => pt.tier_type === 'retail'
      )?.price || 0
      totalInventoryValueRetail += quantity * parseFloat(retailPrice)

      // Categorize stock status
      if (quantity === 0) {
        outOfStockItems++
      } else if (quantity < lowThreshold) {
        lowStockItems++
      } else {
        adequateStockItems++
      }
    })

    const averageStockLevel =
      totalProducts > 0
        ? inventory?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) / totalProducts
        : 0

    return {
      totalProducts,
      totalInventoryValue,
      totalInventoryValueRetail,
      lowStockItems,
      outOfStockItems,
      adequateStockItems,
      averageStockLevel,
      totalAvailableQuantity,
      totalReservedQuantity,
    }
  }

  /**
   * Get category-wise performance data
   */
  static async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    const supabase = createClient()

    const { data, error } = await (supabase as any).rpc('get_category_performance', {})

    if (error) {
      // Fallback query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('categories')
        .select(`
          name,
          products(
            id,
            inventory(quantity, available_quantity)
          )
        `)
        .eq('is_active', true)

      if (fallbackError) throw fallbackError

      const totalInventory = fallbackData?.reduce((sum: number, cat: any) => {
        const catInventory = cat.products?.reduce((pSum: number, p: any) => {
          return pSum + (p.inventory?.[0]?.quantity || 0)
        }, 0)
        return sum + (catInventory || 0)
      }, 0)

      return (
        fallbackData?.map((cat: any) => {
          const productCount = cat.products?.length || 0
          const catTotalInventory = cat.products?.reduce((sum: number, p: any) => {
            return sum + (p.inventory?.[0]?.quantity || 0)
          }, 0)
          const catAvailableInventory = cat.products?.reduce((sum: number, p: any) => {
            return sum + (p.inventory?.[0]?.available_quantity || 0)
          }, 0)

          return {
            categoryName: cat.name,
            productCount,
            totalInventory: catTotalInventory || 0,
            availableInventory: catAvailableInventory || 0,
            percentageOfTotal:
              totalInventory > 0 ? ((catTotalInventory || 0) / totalInventory) * 100 : 0,
          }
        }) || []
      )
    }

    return data || []
  }

  /**
   * Get expiration metrics and critical batches
   */
  static async getExpirationMetrics(): Promise<ExpirationMetrics> {
    const supabase = createClient()

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: batches, error } = await supabase
      .from('product_batches')
      .select(`
        *,
        inventory!inner(
          product_id,
          products!inner(name)
        )
      `)
      .eq('status', 'active')
      .order('expiration_date', { ascending: true })

    if (error) throw error

    let expiringSoon7Days = 0
    let expiringSoon14Days = 0
    let expiringSoon30Days = 0
    let expired = 0
    const criticalBatches: ExpirationMetrics['criticalBatches'] = []

    batches?.forEach((batch: any) => {
      const expirationDate = new Date(batch.expiration_date)
      const daysUntilExpiry = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (expirationDate < now) {
        expired++
      } else if (expirationDate < in7Days) {
        expiringSoon7Days++
        criticalBatches.push({
          productName: batch.inventory?.products?.name || 'Unknown',
          batchNumber: batch.batch_number,
          expirationDate: batch.expiration_date,
          quantity: batch.quantity,
          daysUntilExpiry,
        })
      } else if (expirationDate < in14Days) {
        expiringSoon14Days++
      } else if (expirationDate < in30Days) {
        expiringSoon30Days++
      }
    })

    return {
      expiringSoon7Days,
      expiringSoon14Days,
      expiringSoon30Days,
      expired,
      totalBatches: batches?.length || 0,
      criticalBatches: criticalBatches.slice(0, 10), // Top 10 critical
    }
  }

  /**
   * Get sales metrics
   */
  static async getSalesMetrics(): Promise<SalesMetrics> {
    // Use server client (bypasses RLS) when running in API routes
    const supabase = isServer ? createServerClient() : createClient()
    const branchId = await getMainBranchId()

    console.log('📊 [Analytics Service] Fetching sales metrics:', {
      branchId,
      isServer,
      clientType: isServer ? 'service_role' : 'anon'
    })

    // Get all orders with items for current branch
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(id)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    console.log('📊 [Analytics Service] Orders fetched:', {
      count: orders?.length || 0,
      error: error?.message || 'none',
      sample: orders?.[0]?.order_number || 'none'
    })

    if (error) throw error

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0) || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group by status
    const statusCounts: Record<string, number> = {}
    orders?.forEach((order: any) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
    }))

    const recentOrders =
      orders?.slice(0, 5).map((order: any) => ({
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        orderDate: order.order_date,
        itemCount: order.order_items?.length || 0,
      })) || []

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      recentOrders,
    }
  }

  /**
   * Get pricing tier analysis
   */
  static async getPricingTierAnalysis(): Promise<PricingTierAnalysis[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('price_tiers')
      .select('tier_type, price, product_id')
      .eq('is_active', true)

    if (error) throw error

    const tierStats: Record<
      string,
      { prices: number[]; productIds: Set<string> }
    > = {}

    data?.forEach((tier: any) => {
      if (!tierStats[tier.tier_type]) {
        tierStats[tier.tier_type] = { prices: [], productIds: new Set() }
      }
      tierStats[tier.tier_type].prices.push(parseFloat(tier.price))
      tierStats[tier.tier_type].productIds.add(tier.product_id)
    })

    return Object.entries(tierStats).map(([tierType, stats]) => ({
      tierType,
      productsCount: stats.productIds.size,
      avgPrice:
        stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length,
      minPrice: Math.min(...stats.prices),
      maxPrice: Math.max(...stats.prices),
    }))
  }

  /**
   * Get inventory movement trends
   */
  static async getInventoryMovementTrends(
    days: number = 30
  ): Promise<InventoryMovementTrend[]> {
    const supabase = createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('inventory_movements' as any)
      .select('movement_type, quantity_change, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date and movement type
    const trends: Record<string, Record<string, { count: number; quantity: number }>> = {}

    data?.forEach((movement: any) => {
      const date = new Date(movement.created_at).toISOString().split('T')[0]
      if (!trends[date]) trends[date] = {}
      if (!trends[date][movement.movement_type]) {
        trends[date][movement.movement_type] = { count: 0, quantity: 0 }
      }
      trends[date][movement.movement_type].count++
      trends[date][movement.movement_type].quantity += Math.abs(movement.quantity_change)
    })

    const result: InventoryMovementTrend[] = []
    Object.entries(trends).forEach(([date, types]) => {
      Object.entries(types).forEach(([movementType, stats]) => {
        result.push({
          date,
          movementType,
          totalMovements: stats.count,
          quantityChanged: stats.quantity,
        })
      })
    })

    return result
  }

  /**
   * Get product stock status with recommendations
   */
  static async getProductStockStatus(): Promise<ProductStockStatus[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        products!inner(
          name,
          categories(name),
          brands(name)
        )
      `)
      .order('quantity', { ascending: true })

    if (error) throw error

    return (
      data?.map((item: any) => {
        const quantity = item.quantity || 0
        const lowThreshold = item.low_stock_threshold || 10
        const maxThreshold = item.max_stock_level || 100

        let status: ProductStockStatus['status'] = 'adequate'
        if (quantity === 0) {
          status = 'critical'
        } else if (quantity < lowThreshold * 0.5) {
          status = 'critical'
        } else if (quantity < lowThreshold) {
          status = 'low'
        } else if (quantity > maxThreshold) {
          status = 'overstocked'
        }

        // Estimate days of stock (simplified - assumes average daily usage)
        const daysOfStock = quantity > 0 ? Math.ceil(quantity / 2) : 0

        return {
          productName: item.products?.name || 'Unknown',
          categoryName: item.products?.categories?.name || 'Uncategorized',
          brandName: item.products?.brands?.name || 'Unknown',
          currentQuantity: quantity,
          availableQuantity: item.available_quantity || 0,
          lowStockThreshold: lowThreshold,
          status,
          daysOfStock,
        }
      }) || []
    )
  }

  /**
   * Get aggregated analytics data for AI insights
   */
  static async getAnalyticsSnapshot() {
    const [
      inventoryMetrics,
      categoryPerformance,
      expirationMetrics,
      salesMetrics,
      pricingTierAnalysis,
      productStockStatus,
    ] = await Promise.all([
      this.getInventoryMetrics(),
      this.getCategoryPerformance(),
      this.getExpirationMetrics(),
      this.getSalesMetrics(),
      this.getPricingTierAnalysis(),
      this.getProductStockStatus(),
    ])

    return {
      inventoryMetrics,
      categoryPerformance,
      expirationMetrics,
      salesMetrics,
      pricingTierAnalysis,
      productStockStatus: productStockStatus.slice(0, 20), // Top 20 products
      timestamp: new Date().toISOString(),
    }
  }
}