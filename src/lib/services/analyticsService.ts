import { createClient } from '../supabase/client'
import { createServerClient } from '../supabase/server'
import { getMainBranchId } from '../constants/branch'
import { logger } from '../logger'

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
  monthlySales: Array<{
    month: string
    year: number
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
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

export interface ProductTrafficMetrics {
  productId: string
  productName: string
  orderCount: number
  totalQuantity: number
  isLowTraffic: boolean
}

export class AnalyticsService {
  /**
   * Get comprehensive inventory metrics
   */
  static async getInventoryMetrics(): Promise<InventoryMetrics> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getInventoryMetrics'
    })
    serviceLogger.time('getInventoryMetrics')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching inventory metrics')
      serviceLogger.db('SELECT', 'inventory')

      // Get inventory data with product and pricing info
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            id,
            name,
            price_tiers(price, pricing_type)
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
        (pt: any) => pt.pricing_type === 'retail'
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

      const result = {
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

      const duration = serviceLogger.timeEnd('getInventoryMetrics')
      serviceLogger.success('Inventory metrics fetched successfully', {
        duration,
        totalProducts,
        lowStockItems,
        outOfStockItems
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching inventory metrics', error as Error)
      throw error
    }
  }

  /**
   * Get category-wise performance data
   */
  static async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getCategoryPerformance'
    })
    serviceLogger.time('getCategoryPerformance')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching category performance data')
      serviceLogger.db('RPC', 'get_category_performance')

      const { data, error } = await (supabase as any).rpc('get_category_performance', {})

      if (error) {
        serviceLogger.warn('RPC not available, using fallback query')
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

    const result = data || []
    const duration = serviceLogger.timeEnd('getCategoryPerformance')
    serviceLogger.success('Category performance data fetched successfully', {
      duration,
      categoryCount: result.length
    })

    return result
  } catch (error) {
    serviceLogger.error('Error fetching category performance', error as Error)
    throw error
  }
}

  /**
   * Get expiration metrics and critical batches
   */
  static async getExpirationMetrics(): Promise<ExpirationMetrics> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getExpirationMetrics'
    })
    serviceLogger.time('getExpirationMetrics')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching expiration metrics')

      const now = new Date()
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      serviceLogger.db('SELECT', 'product_batches')
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

    const result = {
      expiringSoon7Days,
      expiringSoon14Days,
      expiringSoon30Days,
      expired,
      totalBatches: batches?.length || 0,
      criticalBatches: criticalBatches.slice(0, 10), // Top 10 critical
    }

    const duration = serviceLogger.timeEnd('getExpirationMetrics')
    serviceLogger.success('Expiration metrics fetched successfully', {
      duration,
      totalBatches: result.totalBatches,
      expiringSoon7Days,
      expired
    })

    return result
  } catch (error) {
    serviceLogger.error('Error fetching expiration metrics', error as Error)
    throw error
  }
}

  /**
   * Get sales metrics
   */
  static async getSalesMetrics(): Promise<SalesMetrics> {
    const serviceLogger = logger.child({ service: 'AnalyticsService', operation: 'getSalesMetrics' })
    serviceLogger.time('getSalesMetrics')

    // Use server client (bypasses RLS) when running in API routes
    const supabase = isServer ? createServerClient() : createClient()
    const branchId = await getMainBranchId()

    serviceLogger.info('Fetching sales metrics', {
      branchId,
      isServer,
      clientType: isServer ? 'service_role' : 'anon'
    })

    // Get all orders with items for current branch
    serviceLogger.db('SELECT', 'orders')
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(id)
      `)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    serviceLogger.debug('Orders fetched', {
      count: orders?.length || 0,
      error: error?.message || 'none',
      sample: orders?.[0]?.order_number || 'none'
    })

    if (error) {
      serviceLogger.error('Failed to fetch orders', error)
      throw error
    }

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

    // Group orders by month and year
    const monthlyData: Record<string, { orders: any[]; revenue: number; count: number }> = {}
    orders?.forEach((order: any) => {
      const orderDate = new Date(order.order_date || order.created_at)
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { orders: [], revenue: 0, count: 0 }
      }

      monthlyData[monthKey].orders.push(order)
      monthlyData[monthKey].revenue += parseFloat(order.total_amount)
      monthlyData[monthKey].count++
    })

    // Convert to array and sort by date (most recent first)
    const monthlySales = Object.entries(monthlyData)
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-')
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December']
        return {
          month: monthNames[parseInt(month) - 1],
          year: parseInt(year),
          totalOrders: data.count,
          totalRevenue: data.revenue,
          averageOrderValue: data.count > 0 ? data.revenue / data.count : 0,
        }
      })
      .sort((a, b) => {
        // Sort by year then month (most recent first)
        if (a.year !== b.year) return b.year - a.year
        const monthIndex = (m: string) => ['January', 'February', 'March', 'April', 'May', 'June',
                                           'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m)
        return monthIndex(b.month) - monthIndex(a.month)
      })

    const result = {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      recentOrders,
      monthlySales,
    }

    const duration = serviceLogger.timeEnd('getSalesMetrics')
    serviceLogger.success('Sales metrics fetched successfully', {
      duration,
      totalOrders,
      totalRevenue: `₱${totalRevenue.toFixed(2)}`,
      averageOrderValue: `₱${averageOrderValue.toFixed(2)}`
    })

    return result
  }

  /**
   * Get pricing tier analysis
   */
  static async getPricingTierAnalysis(): Promise<PricingTierAnalysis[]> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getPricingTierAnalysis'
    })
    serviceLogger.time('getPricingTierAnalysis')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching pricing tier analysis')
      serviceLogger.db('SELECT', 'price_tiers')

      const { data, error } = await supabase
        .from('price_tiers')
        .select('pricing_type, price, product_id')
        .eq('is_active', true)

      if (error) throw error

      const tierStats: Record<
        string,
        { prices: number[]; productIds: Set<string> }
      > = {}

      data?.forEach((tier: any) => {
        if (!tierStats[tier.pricing_type]) {
          tierStats[tier.pricing_type] = { prices: [], productIds: new Set() }
        }
        tierStats[tier.pricing_type].prices.push(parseFloat(tier.price))
        tierStats[tier.pricing_type].productIds.add(tier.product_id)
      })

      const result = Object.entries(tierStats).map(([tierType, stats]) => ({
        tierType,
        productsCount: stats.productIds.size,
        avgPrice:
          stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length,
        minPrice: Math.min(...stats.prices),
        maxPrice: Math.max(...stats.prices),
      }))

      const duration = serviceLogger.timeEnd('getPricingTierAnalysis')
      serviceLogger.success('Pricing tier analysis completed', {
        duration,
        tierCount: result.length
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching pricing tier analysis', error as Error)
      throw error
    }
  }

  /**
   * Get inventory movement trends
   */
  static async getInventoryMovementTrends(
    days: number = 30
  ): Promise<InventoryMovementTrend[]> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getInventoryMovementTrends'
    })
    serviceLogger.time('getInventoryMovementTrends')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching inventory movement trends', { days })

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      serviceLogger.db('SELECT', 'inventory_movements')
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

    const duration = serviceLogger.timeEnd('getInventoryMovementTrends')
    serviceLogger.success('Inventory movement trends fetched successfully', {
      duration,
      days,
      trendCount: result.length
    })

    return result
  } catch (error) {
    serviceLogger.error('Error fetching inventory movement trends', error as Error)
    throw error
  }
}

  /**
   * Get product stock status with recommendations
   */
  static async getProductStockStatus(): Promise<ProductStockStatus[]> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getProductStockStatus'
    })
    serviceLogger.time('getProductStockStatus')

    const supabase = createClient()

    try {
      serviceLogger.info('Fetching product stock status')
      serviceLogger.db('SELECT', 'inventory')

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

      const result = (
        data?.map((item: any) => {
          const quantity = item.quantity || 0
          const lowThreshold = item.low_stock_threshold || 10

          let status: ProductStockStatus['status'] = 'adequate'
          if (quantity === 0) {
            status = 'critical'
          } else if (quantity < lowThreshold * 0.5) {
            status = 'critical'
          } else if (quantity < lowThreshold) {
            status = 'low'
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

      const criticalCount = result.filter(r => r.status === 'critical').length
      const lowCount = result.filter(r => r.status === 'low').length

      const duration = serviceLogger.timeEnd('getProductStockStatus')
      serviceLogger.success('Product stock status fetched successfully', {
        duration,
        totalProducts: result.length,
        criticalCount,
        lowCount
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching product stock status', error as Error)
      throw error
    }
  }

  /**
   * Get product traffic metrics (order frequency in last 30 days)
   * Used to identify low-traffic products that should not get price change recommendations
   */
  static async getProductTrafficMetrics(): Promise<ProductTrafficMetrics[]> {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getProductTrafficMetrics'
    })
    serviceLogger.time('getProductTrafficMetrics')

    const supabase = isServer ? createServerClient() : createClient()
    const branchId = await getMainBranchId()
    const LOW_TRAFFIC_THRESHOLD = 10 // Products with < 10 orders in 30 days are low-traffic

    try {
      serviceLogger.info('Fetching product traffic metrics (30-day window)', {
        branchId,
        threshold: LOW_TRAFFIC_THRESHOLD
      })

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      serviceLogger.db('SELECT', 'order_items with orders join')

      // Query order_items with orders joined, filtered to last 30 days
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          orders!inner(
            id,
            created_at,
            status,
            branch_id
          ),
          products!inner(
            name
          )
        `)
        .eq('orders.branch_id', branchId)
        .neq('orders.status', 'cancelled')
        .gte('orders.created_at', thirtyDaysAgo.toISOString())

      if (error) {
        serviceLogger.error('Failed to fetch order items', error)
        throw error
      }

      serviceLogger.debug('Order items fetched', {
        count: data?.length || 0,
        sample: data?.[0]?.product_id || 'none'
      })

      // Group by product_id and calculate metrics
      const productTraffic: Record<string, {
        productName: string
        orderCount: number
        totalQuantity: number
      }> = {}

      data?.forEach((item: any) => {
        const productId = item.product_id
        const productName = item.products?.name || 'Unknown Product'

        if (!productTraffic[productId]) {
          productTraffic[productId] = {
            productName,
            orderCount: 0,
            totalQuantity: 0
          }
        }

        productTraffic[productId].orderCount++
        productTraffic[productId].totalQuantity += item.quantity || 0
      })

      // Convert to array and add isLowTraffic flag
      const result: ProductTrafficMetrics[] = Object.entries(productTraffic).map(
        ([productId, metrics]) => ({
          productId,
          productName: metrics.productName,
          orderCount: metrics.orderCount,
          totalQuantity: metrics.totalQuantity,
          isLowTraffic: metrics.orderCount < LOW_TRAFFIC_THRESHOLD,
        })
      )

      // Sort by order count (descending) for better insights
      result.sort((a, b) => b.orderCount - a.orderCount)

      const lowTrafficCount = result.filter(p => p.isLowTraffic).length
      const highTrafficCount = result.filter(p => !p.isLowTraffic).length

      const duration = serviceLogger.timeEnd('getProductTrafficMetrics')
      serviceLogger.success('Product traffic metrics fetched successfully', {
        duration,
        totalProducts: result.length,
        lowTrafficCount,
        highTrafficCount,
        threshold: LOW_TRAFFIC_THRESHOLD
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching product traffic metrics', error as Error)
      throw error
    }
  }

  /**
   * Get aggregated analytics data for AI insights
   */
  static async getAnalyticsSnapshot() {
    const serviceLogger = logger.child({
      service: 'AnalyticsService',
      operation: 'getAnalyticsSnapshot'
    })
    serviceLogger.time('getAnalyticsSnapshot')

    try {
      serviceLogger.info('Fetching complete analytics snapshot')

      const [
        inventoryMetrics,
        categoryPerformance,
        expirationMetrics,
        salesMetrics,
        pricingTierAnalysis,
        productStockStatus,
        productTrafficMetrics,
      ] = await Promise.all([
        this.getInventoryMetrics(),
        this.getCategoryPerformance(),
        this.getExpirationMetrics(),
        this.getSalesMetrics(),
        this.getPricingTierAnalysis(),
        this.getProductStockStatus(),
        this.getProductTrafficMetrics(),
      ])

      const result = {
        inventoryMetrics,
        categoryPerformance,
        expirationMetrics,
        salesMetrics,
        pricingTierAnalysis,
        productStockStatus: productStockStatus.slice(0, 20), // Top 20 products
        productTrafficMetrics,
        timestamp: new Date().toISOString(),
      }

      const duration = serviceLogger.timeEnd('getAnalyticsSnapshot')
      serviceLogger.success('Analytics snapshot completed successfully', {
        duration,
        categories: categoryPerformance.length,
        totalProducts: inventoryMetrics.totalProducts,
        totalOrders: salesMetrics.totalOrders
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching analytics snapshot', error as Error)
      throw error
    }
  }
}